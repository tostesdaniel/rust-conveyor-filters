import { getCategorizationStats } from "@/services/ai-categorize";

async function main() {
  const stats = await getCategorizationStats();
  console.log("Public filter categorization status:");
  for (const row of stats.byStatus) {
    console.log(`  ${row.status.padEnd(12)} ${row.count}`);
  }
  console.log(`Pending proposals: ${stats.pendingProposals}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
