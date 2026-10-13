import * as fs from "fs";
import path from "path";
import { SEED_TAGS } from "@/scripts/ai-tags/taxonomy";
import type { ItemSnapshot } from "@/scripts/items/snapshot";
import { generateShareToken } from "@/utils/share-token";
import { clerkClient } from "@clerk/nextjs/server";
import { eq, sql } from "drizzle-orm";

import { db } from "./client";
import itemSnapshot from "./item-snapshot.json";
import { syncItemSnapshot } from "./item-sync";
import {
  categories,
  filterItems,
  filters,
  filterTagAssignments,
  filterTags,
  items,
  sharedFilters,
  shareTokens,
  subCategories,
  userCategories,
  type Category,
} from "./schema";
import {
  findSeedProblems,
  loadSeedAccounts,
  type SeedAccount,
} from "./seed-accounts";

class SeedError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "SeedError";
  }
}

const loadJson = <T>(filePath: string): T => {
  return JSON.parse(fs.readFileSync(path.join(__dirname, filePath), "utf-8"));
};

type UserIds = Map<string, string>;
// username -> filter key -> filter row id
type FilterIds = Map<string, Map<string, number>>;

const seed = async () => {
  if (!process.env.DATABASE_URL) {
    throw new SeedError("DATABASE_URL is not set");
  }
  if (
    !process.env.CLERK_SECRET_KEY ||
    !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  ) {
    throw new SeedError("Clerk secrets are not set");
  }

  const accounts = loadSeedAccounts();
  const itemCategories = loadJson<Category[]>("seed-data/categories.json");
  const problems = findSeedProblems(
    accounts,
    (itemSnapshot as ItemSnapshot).items,
    itemCategories.map((c) => c.name),
    SEED_TAGS.map((t) => t.slug),
  );
  if (problems.length > 0) {
    throw new SeedError(`Seed data is invalid:\n  ${problems.join("\n  ")}`);
  }

  console.log("🌱 Starting database seed...");
  const startTime = Date.now();

  try {
    const userIds = await findOrCreateClerkUsers(accounts);

    console.log("\n📦 Clearing database...");
    await clearDatabase();
    console.log("  ✓ Database cleared");

    await insertCategories(itemCategories);
    await insertItems();
    await insertTags();

    const filterIds: FilterIds = new Map();
    for (const account of accounts) {
      filterIds.set(
        account.account.username,
        await insertAccountFilters(account, userIds),
      );
    }
    await linkForks(accounts, userIds, filterIds);
    await insertShares(accounts, userIds, filterIds);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✨ Seeding completed successfully in ${duration}s\n`);
  } catch (error) {
    throw new SeedError("Seed failed", error);
  }
};

const clearDatabase = async () => {
  try {
    await db.transaction(async (tx) => {
      const tables = await tx.execute(sql`
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public';
      `);

      for (const { tablename } of tables.rows) {
        await tx.execute(
          sql`TRUNCATE TABLE ${sql.identifier(tablename as string)} CASCADE;`,
        );
      }

      const sequences = await tx.execute(sql`
        SELECT sequence_name
        FROM information_schema.sequences
        WHERE sequence_schema = 'public';
      `);

      for (const { sequence_name } of sequences.rows) {
        await tx.execute(
          sql`ALTER SEQUENCE ${sql.identifier(sequence_name as string)} RESTART WITH 1;`,
        );
      }
    });
  } catch (error) {
    throw new SeedError("Failed to clear database", error);
  }
};

const findOrCreateClerkUsers = async (accounts: SeedAccount[]) => {
  try {
    console.log("\n📦 Setting up Clerk users...");
    const clerk = await clerkClient();
    const userIds: UserIds = new Map();
    const rows = [];

    for (const { account } of accounts) {
      const existing = await clerk.users.getUserList({
        username: [account.username],
      });
      let user = existing.data[0];
      const created = !user;
      if (!user) {
        user = await clerk.users.createUser({
          emailAddress: [account.email],
          username: account.username,
          firstName: account.firstName,
          password: account.password,
          skipPasswordChecks: true,
          publicMetadata: account.verifiedType
            ? { verifiedType: account.verifiedType }
            : {},
        });
      }
      userIds.set(account.username, user.id);
      rows.push({ username: account.username, id: user.id, created });
    }

    console.table(rows);
    return userIds;
  } catch (error) {
    throw new SeedError("Failed to set up Clerk users", error);
  }
};

const insertItems = async () => {
  try {
    console.log("\n📦 Inserting items from the item snapshot...");
    const result = await syncItemSnapshot(db);
    console.log(`  ✓ ${result?.inserted ?? 0} items inserted successfully`);
  } catch (error) {
    throw new SeedError("Failed to insert items", error);
  }
};

const insertCategories = async (values: Category[]) => {
  try {
    console.log("\n📦 Inserting categories...");
    await db.insert(categories).values(values);
    console.log(`  ✓ ${values.length} categories inserted successfully`);
  } catch (error) {
    throw new SeedError("Failed to insert categories", error);
  }
};

const insertTags = async () => {
  try {
    console.log("\n📦 Inserting filter tags...");
    await db.insert(filterTags).values(
      SEED_TAGS.map((tag, i) => ({
        slug: tag.slug,
        label: tag.label,
        description: tag.description,
        sortOrder: i,
      })),
    );
    console.log(`  ✓ ${SEED_TAGS.length} tags inserted successfully`);
  } catch (error) {
    throw new SeedError("Failed to insert tags", error);
  }
};

const insertAccountFilters = async (
  { account, categories: seedCategories, filters: seedFilters }: SeedAccount,
  userIds: UserIds,
) => {
  try {
    console.log(`\n📦 Inserting filters for ${account.username}...`);
    const userId = userIds.get(account.username)!;

    const [itemRows, categoryRows, tagRows] = await Promise.all([
      db.select({ id: items.id, shortname: items.shortname }).from(items),
      db.select().from(categories),
      db.select({ id: filterTags.id, slug: filterTags.slug }).from(filterTags),
    ]);
    const itemIds = new Map(itemRows.map((row) => [row.shortname, row.id]));
    const categoryIds = new Map(categoryRows.map((row) => [row.name, row.id]));
    const tagIds = new Map(tagRows.map((row) => [row.slug, row.id]));

    return await db.transaction(async (tx) => {
      const userCategoryIds = new Map<string, number>();
      const subCategoryIds = new Map<string, number>();

      for (const [order, category] of seedCategories.entries()) {
        const [row] = await tx
          .insert(userCategories)
          .values({ name: category.name, userId, order })
          .returning({ id: userCategories.id });
        userCategoryIds.set(category.name, row.id);

        for (const [subOrder, name] of category.subCategories.entries()) {
          const [sub] = await tx
            .insert(subCategories)
            .values({ name, userId, parentId: row.id, order: subOrder })
            .returning({ id: subCategories.id });
          subCategoryIds.set(`${category.name}/${name}`, sub.id);
        }
      }

      const orderInGroup = new Map<string, number>();
      const filterIds = new Map<string, number>();

      for (const filter of seedFilters) {
        const group = `${filter.category ?? ""}/${filter.subCategory ?? ""}`;
        const order = orderInGroup.get(group) ?? 0;
        orderInGroup.set(group, order + 1);

        const [row] = await tx
          .insert(filters)
          .values({
            name: filter.name,
            description: filter.description ?? null,
            authorId: userId,
            imagePath: filter.imagePath,
            isPublic: filter.isPublic,
            categoryId: filter.category
              ? userCategoryIds.get(filter.category)
              : null,
            subCategoryId: filter.subCategory
              ? subCategoryIds.get(`${filter.category}/${filter.subCategory}`)
              : null,
            order,
            outputContainerId: filter.outputContainer
              ? itemIds.get(filter.outputContainer)
              : null,
            viewCount: filter.views,
            exportCount: filter.exports,
            popularityScore: filter.views + filter.exports * 5,
            createdAt: new Date(filter.createdAt),
            updatedAt: new Date(filter.updatedAt),
          })
          .returning({ id: filters.id });
        filterIds.set(filter.key, row.id);

        await tx.insert(filterItems).values(
          filter.items.map((item, position) => ({
            filterId: row.id,
            itemId: "item" in item ? itemIds.get(item.item) : null,
            categoryId:
              "category" in item ? categoryIds.get(item.category) : null,
            max: item.max ?? 0,
            buffer: item.buffer ?? 0,
            min: item.min ?? 0,
            position,
            createdAt: new Date(filter.createdAt),
            updatedAt: new Date(filter.updatedAt),
          })),
        );

        if (filter.tags.length > 0) {
          await tx.insert(filterTagAssignments).values(
            filter.tags.map((slug, i) => ({
              filterId: row.id,
              tagId: tagIds.get(slug)!,
              rank: i + 1,
              modelVersion: "seed",
            })),
          );
        }
      }

      console.log(`  ✓ ${seedFilters.length} filters inserted successfully`);
      return filterIds;
    });
  } catch (error) {
    throw new SeedError(
      `Failed to insert filters for ${account.username}`,
      error,
    );
  }
};

const linkForks = async (
  accounts: SeedAccount[],
  userIds: UserIds,
  filterIds: FilterIds,
) => {
  try {
    console.log("\n📦 Linking forks...");
    let count = 0;
    for (const { account, filters: seedFilters } of accounts) {
      for (const filter of seedFilters) {
        if (!filter.forkedFrom) continue;
        const { username, key } = filter.forkedFrom;
        const sourceId = filterIds.get(username)!.get(key)!;

        await db
          .update(filters)
          .set({
            forkedFromId: sourceId,
            forkedFromAuthorId: userIds.get(username)!,
          })
          .where(
            eq(filters.id, filterIds.get(account.username)!.get(filter.key)!),
          );
        // Each fork adds 10 to its source, matching the fork mutation.
        await db
          .update(filters)
          .set({ popularityScore: sql`${filters.popularityScore} + 10` })
          .where(eq(filters.id, sourceId));
        count++;
      }
    }
    console.log(`  ✓ ${count} forks linked`);
  } catch (error) {
    throw new SeedError("Failed to link forks", error);
  }
};

const insertShares = async (
  accounts: SeedAccount[],
  userIds: UserIds,
  filterIds: FilterIds,
) => {
  try {
    console.log("\n📦 Sharing filters...");
    const tokens = await db
      .insert(shareTokens)
      .values(
        accounts.map(({ account }) => ({
          userId: userIds.get(account.username)!,
          token: generateShareToken(),
        })),
      )
      .returning({ id: shareTokens.id, userId: shareTokens.userId });
    const tokenIds = new Map(tokens.map((t) => [t.userId, t.id]));

    const rows = accounts.flatMap(({ account, shares = [] }) =>
      shares.flatMap((share) =>
        share.filters.map((key) => ({
          filterId: filterIds.get(account.username)!.get(key)!,
          shareTokenId: tokenIds.get(userIds.get(share.to)!)!,
          senderId: userIds.get(account.username)!,
        })),
      ),
    );
    if (rows.length > 0) {
      await db.insert(sharedFilters).values(rows);
    }
    console.log(`  ✓ ${rows.length} filters shared`);
  } catch (error) {
    throw new SeedError("Failed to share filters", error);
  }
};

async function main() {
  try {
    await seed();
    process.exit(0);
  } catch (error) {
    if (error instanceof SeedError) {
      console.error("\n❌ Seed failed:", error.message);
      if (error.cause) {
        console.error("Caused by:", error.cause);
      }
    } else {
      console.error("\n❌ Unexpected error:", error);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
