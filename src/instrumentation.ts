export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { startRevokeExpiredSubscriptionsCron } = await import(
    "@/server/crons/revoke-expired-subscriptions"
  );
  startRevokeExpiredSubscriptionsCron();
}
