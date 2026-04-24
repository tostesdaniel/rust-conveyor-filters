import { stdin as input, stdout as output } from "node:process";
import { createInterface } from "node:readline/promises";
import { db } from "@/db/client";
import { and, desc, eq } from "drizzle-orm";

import { filterTagProposals, filterTags } from "@/db/schema";

async function nextSortOrder(): Promise<number> {
  const top = await db
    .select({ sortOrder: filterTags.sortOrder })
    .from(filterTags)
    .orderBy(desc(filterTags.sortOrder))
    .limit(1);
  return (top[0]?.sortOrder ?? 0) + 1;
}

async function main() {
  const rl = createInterface({ input, output });
  const ask = (q: string) => rl.question(q);

  const existingTags = await db
    .select({
      id: filterTags.id,
      slug: filterTags.slug,
      label: filterTags.label,
    })
    .from(filterTags)
    .where(eq(filterTags.status, "active"))
    .orderBy(filterTags.sortOrder);
  const tagsBySlug = new Map(existingTags.map((p) => [p.slug, p]));

  const proposals = await db
    .select()
    .from(filterTagProposals)
    .where(eq(filterTagProposals.status, "pending"))
    .orderBy(desc(filterTagProposals.occurrenceCount), filterTagProposals.id);

  if (proposals.length === 0) {
    console.log("No pending proposals.");
    rl.close();
    process.exit(0);
  }

  console.log(`\n${proposals.length} pending proposals.\n`);

  for (let i = 0; i < proposals.length; i++) {
    const p = proposals[i];
    console.log("-".repeat(60));
    console.log(`[${i + 1}/${proposals.length}] ${p.label} (${p.slug})`);
    console.log(`  occurrences: ${p.occurrenceCount}`);
    if (p.rationale) console.log(`  rationale: ${p.rationale}`);
    if (p.exampleFilterId)
      console.log(`  example filter id: ${p.exampleFilterId}`);

    const action = (
      await ask(
        "  action [a=approve, r=rename, m=merge, j=reject, s=skip, q=quit]: ",
      )
    )
      .trim()
      .toLowerCase();

    if (action === "q") break;
    if (action === "s" || action === "") {
      continue;
    }

    if (action === "j") {
      await db
        .update(filterTagProposals)
        .set({ status: "rejected", reviewedAt: new Date() })
        .where(eq(filterTagProposals.id, p.id));
      console.log("  -> rejected");
      continue;
    }

    if (action === "m") {
      const target = (await ask("  merge into which slug?: ")).trim();
      const tag = tagsBySlug.get(target);
      if (!tag) {
        console.log(`  unknown slug "${target}", skipping`);
        continue;
      }
      await db
        .update(filterTagProposals)
        .set({
          status: "merged",
          mergedIntoTagId: tag.id,
          reviewedAt: new Date(),
        })
        .where(eq(filterTagProposals.id, p.id));
      console.log(`  -> merged into ${tag.slug}`);
      continue;
    }

    if (action === "a" || action === "r") {
      let slug = p.slug;
      let label = p.label;
      if (action === "r") {
        const newSlug = (await ask(`  new slug [${p.slug}]: `)).trim();
        const newLabel = (await ask(`  new label [${p.label}]: `)).trim();
        if (newSlug) slug = newSlug;
        if (newLabel) label = newLabel;
      }

      if (tagsBySlug.has(slug)) {
        console.log(`  slug "${slug}" already exists; treat as merge instead.`);
        const tag = tagsBySlug.get(slug)!;
        await db
          .update(filterTagProposals)
          .set({
            status: "merged",
            mergedIntoTagId: tag.id,
            reviewedAt: new Date(),
          })
          .where(eq(filterTagProposals.id, p.id));
        console.log(`  -> merged into ${tag.slug}`);
        continue;
      }

      const sortOrder = await nextSortOrder();
      const [inserted] = await db
        .insert(filterTags)
        .values({
          slug,
          label,
          description: p.rationale?.slice(0, 255) ?? null,
          status: "active",
          sortOrder,
        })
        .returning({ id: filterTags.id, slug: filterTags.slug });

      tagsBySlug.set(inserted.slug, {
        id: inserted.id,
        slug: inserted.slug,
        label,
      });

      await db
        .update(filterTagProposals)
        .set({
          status: "approved",
          mergedIntoTagId: inserted.id,
          reviewedAt: new Date(),
        })
        .where(eq(filterTagProposals.id, p.id));

      // Also clean up other pending proposals with the same slug so we don't
      // re-prompt for them.
      await db
        .update(filterTagProposals)
        .set({
          status: "merged",
          mergedIntoTagId: inserted.id,
          reviewedAt: new Date(),
        })
        .where(
          and(
            eq(filterTagProposals.slug, slug),
            eq(filterTagProposals.status, "pending"),
          ),
        );

      console.log(`  -> approved as ${slug}`);
      continue;
    }

    console.log(`  unknown action "${action}", skipping`);
  }

  rl.close();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
