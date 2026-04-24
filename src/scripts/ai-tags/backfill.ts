import { enqueueAllPublicFilters } from "@/services/ai-categorize";

async function main() {
  const count = await enqueueAllPublicFilters();
  console.log(`Marked ${count} public filters as pending.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
