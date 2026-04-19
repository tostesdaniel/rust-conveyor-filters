import "server-only";

import { revokeExpiredSubscriptions } from "@/services/subscriptions";
import { Cron } from "croner";

const SCHEDULE = "0 * * * *";
const JOB_NAME = "revoke-expired-subscriptions";

let job: Cron | null = null;

export function startRevokeExpiredSubscriptionsCron(): Cron {
  if (job) return job;

  job = new Cron(
    SCHEDULE,
    { name: JOB_NAME, protect: true, timezone: "UTC" },
    async () => {
      try {
        const result = await revokeExpiredSubscriptions();
        if (result.processed > 0) {
          console.log(
            `[cron:${JOB_NAME}] revoked ${result.processed} expired subscription(s)`,
          );
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
