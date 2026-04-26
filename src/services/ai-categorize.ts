import { db } from "@/db/client";
import { and, desc, eq, notExists, sql } from "drizzle-orm";

import { categorizeFilter } from "@/lib/ai/categorize-filter";
import { computeFilterContentHash } from "@/lib/ai/content-hash";
import { MAX_FILTER_TAGS } from "@/lib/ai/tag-limits";
import {
  filters,
  filterTagAssignments,
  filterTagProposals,
  filterTags,
} from "@/db/schema";

export interface CategorizeAndStoreOptions {
  filterId: number;
  allowProposals?: boolean;
}

export interface CategorizeAndStoreResult {
  assignedTags: Array<{ slug: string; label: string; rank: number }>;
  proposalCount: number;
  provider: "google" | "groq";
}

/**
 * Loads the active taxonomy once per call.
 */
async function loadActiveTaxonomy() {
  const rows = await db
    .select({
      id: filterTags.id,
      slug: filterTags.slug,
      label: filterTags.label,
      description: filterTags.description,
    })
    .from(filterTags)
    .where(eq(filterTags.status, "active"))
    .orderBy(filterTags.sortOrder, filterTags.id);
  return rows;
}

/**
 * Load a filter with items and categories shaped for the AI prompt.
 */
async function loadFilterForCategorization(filterId: number) {
  const filter = await db.query.filters.findFirst({
    where: eq(filters.id, filterId),
    with: {
      filterItems: {
        with: { item: true, category: true },
      },
    },
  });
  if (!filter) return null;

  const items = filter.filterItems
    .map((fi) => {
      if (fi.item) {
        return {
          shortname: fi.item.shortname,
          name: fi.item.name,
          category: fi.item.category,
          max: fi.max,
          buffer: fi.buffer,
          min: fi.min,
        };
      }
      if (fi.category) {
        return {
          shortname: `category:${fi.category.name.toLowerCase().replace(/\s+/g, "_")}`,
          name: `All ${fi.category.name}`,
          category: fi.category.name,
          max: fi.max,
          buffer: fi.buffer,
          min: fi.min,
        };
      }
      return null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const contentHash = computeFilterContentHash({
    name: filter.name,
    description: filter.description,
    itemShortnames: items.map((i) => i.shortname),
    categoryNames: items
      .map((i) => i.category)
      .filter((c): c is string => typeof c === "string"),
  });

  return {
    id: filter.id,
    name: filter.name,
    description: filter.description,
    isPublic: filter.isPublic,
    items,
    contentHash,
  };
}

/**
 * Categorize one filter, persist its tags, proposals, and status in a single
 * transaction. Safe to call concurrently for different filters.
 */
export async function categorizeAndStore(
  options: CategorizeAndStoreOptions,
): Promise<CategorizeAndStoreResult> {
  const { filterId, allowProposals = false } = options;

  const filter = await loadFilterForCategorization(filterId);
  if (!filter) {
    throw new Error(`Filter ${filterId} not found`);
  }

  const taxonomy = await loadActiveTaxonomy();
  if (taxonomy.length === 0) {
    throw new Error("No active tags in taxonomy. Run seed-taxonomy first.");
  }

  const result = await categorizeFilter({
    name: filter.name,
    description: filter.description,
    items: filter.items,
    taxonomy: taxonomy.map((t) => ({
      slug: t.slug,
      label: t.label,
      description: t.description,
    })),
    allowProposals,
  });

  const slugToId = new Map(taxonomy.map((t) => [t.slug, t.id]));
  const slugToLabel = new Map(taxonomy.map((t) => [t.slug, t.label]));

  const validTags = result.tags
    .filter((p) => slugToId.has(p.slug))
    .slice(0, MAX_FILTER_TAGS);

  const assignedTags = validTags.map((p, idx) => ({
    slug: p.slug,
    label: slugToLabel.get(p.slug)!,
    rank: idx + 1,
  }));

  await db.transaction(async (tx) => {
    await tx
      .delete(filterTagAssignments)
      .where(eq(filterTagAssignments.filterId, filterId));

    if (validTags.length > 0) {
      await tx.insert(filterTagAssignments).values(
        validTags.map((p, idx) => ({
          filterId,
          tagId: slugToId.get(p.slug)!,
          rank: idx + 1,
          confidence: p.confidence.toFixed(2),
          modelVersion: result.modelVersion,
        })),
      );
    }

    for (const proposal of result.proposals) {
      const existing = await tx
        .select({ id: filterTagProposals.id })
        .from(filterTagProposals)
        .where(
          and(
            eq(filterTagProposals.slug, proposal.slug),
            eq(filterTagProposals.status, "pending"),
          ),
        )
        .limit(1);

      if (existing.length > 0) {
        await tx
          .update(filterTagProposals)
          .set({
            occurrenceCount: sql`${filterTagProposals.occurrenceCount} + 1`,
          })
          .where(eq(filterTagProposals.id, existing[0].id));
      } else {
        await tx.insert(filterTagProposals).values({
          slug: proposal.slug,
          label: proposal.label,
          rationale: proposal.rationale,
          exampleFilterId: filterId,
          occurrenceCount: 1,
          status: "pending",
        });
      }
    }

    await tx
      .update(filters)
      .set({
        aiCategorizationStatus: "ok",
        aiCategorizationContentHash: filter.contentHash,
        aiCategorizedAt: new Date(),
        aiCategorizationError: null,
      })
      .where(eq(filters.id, filterId));
  });

  return {
    assignedTags,
    proposalCount: result.proposals.length,
    provider: result.provider,
  };
}

/**
 * Mark a filter as pending categorization if either:
 *   - it has no content hash yet (never categorized), or
 *   - the current content hash differs from the stored one (meaningful edit).
 * Does nothing if categorization is disabled or the filter is private.
 */
export async function enqueueFilterIfChanged(options: {
  filterId: number;
  onlyIfPublic?: boolean;
}): Promise<boolean> {
  if (process.env.AI_CATEGORIZATION_DISABLED === "1") return false;

  const filter = await loadFilterForCategorization(options.filterId);
  if (!filter) return false;
  if (options.onlyIfPublic && !filter.isPublic) return false;

  const stored = await db.query.filters.findFirst({
    where: eq(filters.id, options.filterId),
    columns: {
      aiCategorizationContentHash: true,
      aiCategorizationStatus: true,
    },
  });

  const unchanged =
    stored?.aiCategorizationContentHash === filter.contentHash &&
    stored.aiCategorizationStatus === "ok";

  if (unchanged) return false;

  await db
    .update(filters)
    .set({
      aiCategorizationStatus: "pending",
      aiCategorizationError: null,
    })
    .where(eq(filters.id, options.filterId));
  return true;
}

/**
 * Pick up pending filters, transition them to processing, categorize, persist.
 * Uses FOR UPDATE SKIP LOCKED so multiple worker invocations are safe.
 */
export async function processPendingBatch(options: {
  batchSize?: number;
  maxAttempts?: number;
}): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  const batchSize = options.batchSize ?? 10;
  const maxAttempts = options.maxAttempts ?? 5;

  const claimed = await db.execute<{ id: number }>(sql`
    WITH next_rows AS (
      SELECT id
      FROM filters
      WHERE ai_categorization_status = 'pending'
        AND is_public = true
        AND ai_categorization_attempts < ${maxAttempts}
      ORDER BY ai_categorization_attempts ASC, id ASC
      LIMIT ${batchSize}
      FOR UPDATE SKIP LOCKED
    )
    UPDATE filters
    SET ai_categorization_status = 'processing',
        ai_categorization_attempts = ai_categorization_attempts + 1
    WHERE id IN (SELECT id FROM next_rows)
    RETURNING id
  `);

  const ids = (claimed.rows as Array<{ id: number }>).map((r) => r.id);
  if (ids.length === 0) {
    return { processed: 0, succeeded: 0, failed: 0 };
  }

  let succeeded = 0;
  let failed = 0;

  for (const id of ids) {
    try {
      await categorizeAndStore({ filterId: id, allowProposals: true });
      succeeded += 1;
    } catch (err) {
      failed += 1;
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[ai-categorize] filter ${id} failed:`, message);
      await db
        .update(filters)
        .set({
          aiCategorizationStatus: "failed",
          aiCategorizationError: message.slice(0, 500),
        })
        .where(eq(filters.id, id));
    }
  }

  return { processed: ids.length, succeeded, failed };
}

/**
 * Enqueue the top-N most popular public filters with open-proposal mode so the
 * model is free to suggest new taxonomy entries. Used once during bootstrap.
 */
export async function bootstrapFromPopular(options: {
  limit?: number;
  sleepMsBetween?: number;
}) {
  const limit = options.limit ?? 200;
  const sleep = options.sleepMsBetween ?? 5000;

  const rows = await db
    .select({ id: filters.id, name: filters.name })
    .from(filters)
    .where(
      and(
        eq(filters.isPublic, true),
        notExists(
          db
            .select()
            .from(filterTagAssignments)
            .where(eq(filterTagAssignments.filterId, filters.id)),
        ),
      ),
    )
    .orderBy(desc(filters.popularityScore), filters.id)
    .limit(limit);

  console.log(
    `Bootstrapping up to ${limit} most popular public filters with no tag assignments (found ${rows.length})...`,
  );

  let succeeded = 0;
  let failed = 0;
  let proposalsAdded = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const result = await categorizeAndStore({
        filterId: row.id,
        allowProposals: true,
      });
      succeeded += 1;
      proposalsAdded += result.proposalCount;
      console.log(
        `  [${i + 1}/${rows.length}] filter ${row.id} "${row.name}" -> ` +
          `${result.assignedTags.map((p) => p.slug).join(", ")}` +
          (result.proposalCount > 0
            ? ` (+${result.proposalCount} proposal${result.proposalCount === 1 ? "" : "s"})`
            : ""),
      );
    } catch (err) {
      failed += 1;
      console.error(
        `  [${i + 1}/${rows.length}] filter ${row.id} "${row.name}" FAILED:`,
        err instanceof Error ? err.message : err,
      );
    }
    if (i < rows.length - 1) {
      await new Promise((r) => setTimeout(r, sleep));
    }
  }

  console.log(
    `Bootstrap done. succeeded=${succeeded} failed=${failed} proposals=${proposalsAdded}`,
  );
  return { succeeded, failed, proposalsAdded };
}

/**
 * Mark every public filter as pending. Used once after the taxonomy is locked
 * in to drain all public filters via the cron worker.
 */
export async function enqueueAllPublicFilters(): Promise<number> {
  const result = await db
    .update(filters)
    .set({
      aiCategorizationStatus: "pending",
      aiCategorizationAttempts: 0,
      aiCategorizationError: null,
    })
    .where(eq(filters.isPublic, true))
    .returning({ id: filters.id });
  return result.length;
}

/**
 * Convenience: stats for queue health.
 */
export async function getCategorizationStats() {
  const rows = await db.execute<{ status: string; count: number }>(sql`
    SELECT ai_categorization_status AS status, COUNT(*)::int AS count
    FROM filters
    WHERE is_public = true
    GROUP BY ai_categorization_status
  `);

  const pending = await db.execute<{ count: number }>(sql`
    SELECT COUNT(*)::int AS count
    FROM filter_tag_proposals
    WHERE status = 'pending'
  `);

  return {
    byStatus: rows.rows as Array<{ status: string; count: number }>,
    pendingProposals:
      (pending.rows[0] as { count: number } | undefined)?.count ?? 0,
  };
}
