import { db } from "@/db";
import { syncItemSnapshot } from "@/db/item-sync";
import { startAiCategorizeCron } from "@/server/crons/ai-categorize";
import { startRevokeExpiredSubscriptionsCron } from "@/server/crons/revoke-expired-subscriptions";

// Awaited so the first request already sees this build's catalogue. A failed
// sync leaves last build's items up rather than taking the site down, and the
// next boot tries again.
try {
  const result = await syncItemSnapshot(db);
  if (result) {
    console.log(
      `items: synced game build ${result.manifestId} (${result.inserted} new, ` +
        `${result.updated} changed, ${result.retired} retired, ` +
        `${result.repointed} filter items repointed, ${result.dropped} duplicates dropped)`,
    );
  }
} catch (err) {
  console.error("items: snapshot sync failed", err);
}

startRevokeExpiredSubscriptionsCron();
startAiCategorizeCron();
