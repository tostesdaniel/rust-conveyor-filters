import { bootstrapFromPopular } from "@/services/ai-categorize";

async function main() {
  const limit = Number.parseInt(process.env.BOOTSTRAP_LIMIT ?? "250", 10);
  const sleepMs = Number.parseInt(process.env.BOOTSTRAP_SLEEP_MS ?? "5000", 10);

  await bootstrapFromPopular({ limit, sleepMsBetween: sleepMs });
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
