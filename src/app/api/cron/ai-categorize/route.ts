import { NextResponse, type NextRequest } from "next/server";
import { processPendingBatch } from "@/services/ai-categorize";

export const dynamic = "force-dynamic";

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
  if (auth !== `Bearer ${secret}`) {
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

  const batchSize = Number.parseInt(
    request.nextUrl.searchParams.get("batch") ??
      process.env.AI_CATEGORIZATION_BATCH_SIZE ??
      "10",
    10,
  );

  try {
    const result = await processPendingBatch({ batchSize });
    return NextResponse.json({ ok: true, ...result }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
