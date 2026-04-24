import "server-only";

import { processPendingBatch } from "@/services/ai-categorize";
import { Cron } from "croner";

/**
 * Drains the AI categorization queue. Runs every minute; each tick claims up
 * to BATCH_SIZE pending public filters, calls the model, persists tags.
 *
 * The worker also uses SELECT ... FOR UPDATE
 * SKIP LOCKED so concurrent ticks (if any) do not double-process rows.
 */
const SCHEDULE = "*/1 * * * *";
const JOB_NAME = "ai-categorize";
const BATCH_SIZE = Number.parseInt(
  process.env.AI_CATEGORIZATION_BATCH_SIZE ?? "10",
  10,
);

let job: Cron | null = null;

export function startAiCategorizeCron(): Cron {
  if (job) return job;

  job = new Cron(
    SCHEDULE,
    { name: JOB_NAME, protect: true, timezone: "UTC" },
    async () => {
      if (process.env.AI_CATEGORIZATION_DISABLED === "1") return;
      if (
        !process.env.GOOGLE_GENERATIVE_AI_API_KEY &&
        !process.env.GROQ_API_KEY
      ) {
        return;
      }

      try {
        const result = await processPendingBatch({ batchSize: BATCH_SIZE });
        if (result.processed > 0) {
          console.log(
            `[cron:${JOB_NAME}] processed=${result.processed} succeeded=${result.succeeded} failed=${result.failed}`,
          );
        }
      } catch (error) {
        console.error(`[cron:${JOB_NAME}] failed`, error);
      }
    },
  );

  const next = job.nextRun();
  console.log(
    `[cron:${JOB_NAME}] scheduled (${SCHEDULE} UTC, batch=${BATCH_SIZE}), next run: ${next?.toISOString() ?? "unknown"}`,
  );

  return job;
}
