import { startAiCategorizeCron } from "@/server/crons/ai-categorize";
import { startRevokeExpiredSubscriptionsCron } from "@/server/crons/revoke-expired-subscriptions";

startRevokeExpiredSubscriptionsCron();
startAiCategorizeCron();
