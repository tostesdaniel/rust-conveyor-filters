import { db } from "@/db/client";

import { filterTags } from "@/db/schema";

import { SEED_TAGS } from "./taxonomy";

/**
 * Idempotent: inserts missing seed tags and updates labels/descriptions of
 * existing ones. Does NOT touch tags that aren't in the seed list (so
 * approved proposals survive reruns).
 */
async function main() {
  console.log(`Seeding ${SEED_TAGS.length} tags...`);

  for (let i = 0; i < SEED_TAGS.length; i++) {
    const tag = SEED_TAGS[i];
    await db
      .insert(filterTags)
      .values({
        slug: tag.slug,
        label: tag.label,
        description: tag.description,
        status: "active",
        sortOrder: i,
      })
      .onConflictDoUpdate({
        target: filterTags.slug,
        set: {
          label: tag.label,
          description: tag.description,
          sortOrder: i,
          updatedAt: new Date(),
        },
      });
  }

  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
