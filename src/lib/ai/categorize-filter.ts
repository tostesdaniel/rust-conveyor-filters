import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { generateText, Output } from "ai";
import { z } from "zod";

import {
  formatFilterForPrompt,
  formatTaxonomy,
  RUST_SYSTEM_PROMPT,
} from "./rust-knowledge";
import { MAX_FILTER_TAGS } from "./tag-limits";

export const AI_MODEL_VERSION = "gemini-2.5-flash@v1";

const PRIMARY_MODEL_ID = "gemini-2.5-flash";
const DEFAULT_GROQ_FALLBACK_MODEL = "openai/gpt-oss-20b";

const SLUG_REGEX = /^[a-z0-9_]+$/;

export interface CategorizationInputItem {
  shortname: string;
  name: string;
  category: string | null;
  max: number;
  buffer: number;
  min: number;
}

export interface CategorizationTaxonomyEntry {
  slug: string;
  label: string;
  description: string | null;
}

export interface CategorizationInput {
  name: string;
  description: string | null;
  items: CategorizationInputItem[];
  taxonomy: CategorizationTaxonomyEntry[];
  allowProposals: boolean;
}

export interface CategorizationResult {
  tags: Array<{ slug: string; confidence: number }>;
  proposals: Array<{ slug: string; label: string; rationale: string }>;
  modelVersion: string;
  provider: "google" | "groq";
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
}

/**
 * Builds the response schema with the taxonomy slugs baked in as an enum so
 * the provider rejects anything that is not a valid taxonomy tag.
 */
function buildResponseSchema(input: CategorizationInput) {
  const slugs = input.taxonomy.map((p) => p.slug);
  if (slugs.length === 0) {
    throw new Error("Cannot categorize with an empty taxonomy");
  }
  const slugEnum = z.enum(slugs as [string, ...string[]]);

  const proposalSchema = z.object({
    slug: z
      .string()
      .min(2)
      .max(48)
      .regex(SLUG_REGEX, "slug must be snake_case ASCII"),
    label: z.string().min(2).max(40),
    rationale: z.string().min(2).max(300),
  });

  return z.object({
    tags: z
      .array(
        z.object({
          slug: slugEnum,
          confidence: z.number().min(0).max(1),
        }),
      )
      .min(1)
      .max(MAX_FILTER_TAGS),
    proposals: input.allowProposals
      ? z.array(proposalSchema).max(2)
      : z.array(proposalSchema).max(0),
  });
}

function buildPrompt(input: CategorizationInput) {
  return {
    system:
      RUST_SYSTEM_PROMPT +
      `\n\nAvailable tags (you MUST pick 1-${MAX_FILTER_TAGS} from this list):\n` +
      formatTaxonomy(input.taxonomy) +
      (input.allowProposals
        ? "\n\nYou MAY also suggest up to 2 proposals for genuinely new intents not covered by the list."
        : "\n\nDo NOT suggest new tags. Pick from the list only."),
    prompt: formatFilterForPrompt(input),
  };
}

function getGoogleModel() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) return null;
  const google = createGoogleGenerativeAI({ apiKey });
  return google(PRIMARY_MODEL_ID);
}

function getGroqModel() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  const modelId =
    process.env.GROQ_CATEGORIZATION_MODEL?.trim() ||
    DEFAULT_GROQ_FALLBACK_MODEL;
  const groq = createGroq({ apiKey });
  return groq(modelId);
}

/**
 * Errors that should trigger a model fallback.
 */
function shouldFallback(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return (
    msg.includes("429") ||
    msg.includes("quota") ||
    msg.includes("rate") ||
    msg.includes("overload") ||
    msg.includes("unavailable") ||
    msg.includes("5xx") ||
    msg.includes("timeout") ||
    /\b5\d\d\b/.test(msg)
  );
}

/**
 * Normalizes the provider result: drops duplicate tag slugs and caps the count.
 */
function normalizeResult(
  raw: {
    tags: Array<{ slug: string; confidence: number }>;
    proposals: Array<{ slug: string; label: string; rationale: string }>;
  },
  provider: "google" | "groq",
): Omit<CategorizationResult, "usage"> {
  const seen = new Set<string>();
  const tags: Array<{ slug: string; confidence: number }> = [];
  for (const p of raw.tags) {
    if (seen.has(p.slug)) continue;
    seen.add(p.slug);
    tags.push({
      slug: p.slug,
      confidence: Math.max(0, Math.min(1, p.confidence)),
    });
    if (tags.length >= MAX_FILTER_TAGS) break;
  }

  const proposalSeen = new Set<string>();
  const proposals: CategorizationResult["proposals"] = [];
  for (const p of raw.proposals ?? []) {
    const slug = p.slug.toLowerCase();
    if (!SLUG_REGEX.test(slug)) continue;
    if (seen.has(slug)) continue;
    if (proposalSeen.has(slug)) continue;
    proposalSeen.add(slug);
    proposals.push({
      slug,
      label: p.label.trim(),
      rationale: p.rationale.trim(),
    });
  }

  return { tags, proposals, provider, modelVersion: AI_MODEL_VERSION };
}

/**
 * Categorize a single filter with Gemini, falling back to Groq on quota /
 * transient failures. Throws if both providers fail or if neither is configured.
 */
export async function categorizeFilter(
  input: CategorizationInput,
): Promise<CategorizationResult> {
  const schema = buildResponseSchema(input);
  const { system, prompt } = buildPrompt(input);

  const primary = getGoogleModel();
  const fallback = getGroqModel();

  if (!primary && !fallback) {
    throw new Error(
      "No AI provider configured. Set GOOGLE_GENERATIVE_AI_API_KEY or GROQ_API_KEY.",
    );
  }

  const attempts: Array<{
    provider: "google" | "groq";
    model: ReturnType<typeof getGoogleModel>;
  }> = [];
  if (primary) attempts.push({ provider: "google", model: primary });
  if (fallback) attempts.push({ provider: "groq", model: fallback });

  let lastError: unknown;
  for (let i = 0; i < attempts.length; i++) {
    const attempt = attempts[i];
    if (!attempt.model) continue;
    try {
      const result = await generateText({
        model: attempt.model,
        output: Output.object({ schema }),
        system,
        prompt,
        temperature: 0.2,
      });

      const normalized = normalizeResult(
        result.output as {
          tags: Array<{ slug: string; confidence: number }>;
          proposals: Array<{ slug: string; label: string; rationale: string }>;
        },
        attempt.provider,
      );

      return {
        ...normalized,
        usage: {
          inputTokens: result.usage?.inputTokens,
          outputTokens: result.usage?.outputTokens,
          totalTokens: result.usage?.totalTokens,
        },
      };
    } catch (err) {
      lastError = err;
      const isLast = i === attempts.length - 1;
      if (isLast || !shouldFallback(err)) {
        throw err;
      }
      console.warn(
        `[ai-categorize] ${attempt.provider} failed (${(err as Error).message}); trying fallback`,
      );
    }
  }

  throw lastError ?? new Error("Categorization failed with no attempts made");
}
