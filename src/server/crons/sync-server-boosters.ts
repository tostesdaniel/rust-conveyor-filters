import "server-only";

import { syncServerBoosters } from "@/services/server-boosters";
import { clerkClient } from "@clerk/nextjs/server";
import { Cron } from "croner";

// The source of truth for Server booster ad-free. The gateway bot only makes
// grants and revokes show up sooner, and misses anything while it's down.
const SCHEDULE = "30 * * * *";
const JOB_NAME = "sync-server-boosters";

let job: Cron | null = null;

export function startSyncServerBoostersCron(): Cron | null {
  if (job) return job;

  const token = process.env.DISCORD_TOKEN;
  if (!token) {
    console.warn(`[cron:${JOB_NAME}] DISCORD_TOKEN not set, not scheduling`);
    return null;
  }

  job = new Cron(
    SCHEDULE,
    { name: JOB_NAME, protect: true, timezone: "UTC" },
    async () => {
      try {
        const changes = await syncServerBoosters(await clerkClient(), token);
        if (changes.length > 0) {
          console.log(`[cron:${JOB_NAME}] updated ${changes.length} user(s)`);
        }
      } catch (error) {
        console.error(`[cron:${JOB_NAME}] failed`, error);
      }
    },
  );

  const next = job.nextRun();
  console.log(
    `[cron:${JOB_NAME}] scheduled (${SCHEDULE} UTC), next run: ${next?.toISOString() ?? "unknown"}`,
  );

  return job;
}
