import { NextResponse, type NextRequest } from "next/server";
import { processPendingBatch } from "@/services/ai-categorize";

import { secureCompare } from "@/lib/secure-compare";

export const dynamic = "force-dynamic";

const DEFAULT_BATCH_SIZE = 10;
const MAX_BATCH_SIZE = 100;

function resolveBatchSize(raw: string | null): number {
  const parsed = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(parsed)) {
    return DEFAULT_BATCH_SIZE;
  }
  return Math.min(Math.max(parsed, 1), MAX_BATCH_SIZE);
}

/**
 * Optional HTTP trigger for the AI categorization worker.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.AI_CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "AI_CRON_SECRET not configured" },
      { status: 503 },
    );
  }

  const auth = request.headers.get("authorization") ?? "";
  if (!secureCompare(auth, `Bearer ${secret}`)) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  }

  if (process.env.AI_CATEGORIZATION_DISABLED === "1") {
    return NextResponse.json(
      { ok: true, skipped: "disabled" },
      { status: 200 },
    );
  }

  // ?batch= is caller-controlled, so clamp it before it hits the worker's query limit.
  const batchSize = resolveBatchSize(
    request.nextUrl.searchParams.get("batch") ??
      process.env.AI_CATEGORIZATION_BATCH_SIZE ??
      null,
  );

  try {
    const result = await processPendingBatch({ batchSize });
    return NextResponse.json({ ok: true, ...result }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
