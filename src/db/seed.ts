import * as fs from "fs";
import path from "path";
import { clerkClient } from "@clerk/nextjs/server";
import { sql } from "drizzle-orm";

import { db } from ".";
import {
  categories,
  filterItems,
  filters,
  items,
  userCategories,
  type Category,
  type Filter,
  type FilterItem,
  type Item,
  type UserCategory,
} from "./schema";

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

  console.log("🌱 Starting database seed...");
  const startTime = Date.now();

  try {
    console.log("\n📦 Clearing database...");
    await clearDatabase();
    console.log("  ✓ Database cleared");

    const userIds = await createClerkUsers();
    if (!userIds || userIds.length !== 2) {
      throw new SeedError("Failed to create required users");
    }

    await insertCategories();
    await insertItems();
    const categoryIdMap = await insertUserCategories([
      userIds[0],
      userIds[1],
    ] as UserIds);
    const filterIdMap = await insertFilters(
      [userIds[0], userIds[1]] as UserIds,
      categoryIdMap,
    );
    await insertFilterItems([userIds[0], userIds[1]] as UserIds, filterIdMap);

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

const createClerkUsers = async () => {
  try {
    console.log("\n📦 Setting up Clerk users...");
    const clerk = await clerkClient();
    const users = await clerk.users.getUserList();

    if (users.data.length > 0) {
      console.log("  ↪ Found existing users, clearing...");
      await Promise.all(
        users.data.map((user) => clerk.users.deleteUser(user.id)),
      );
      console.log("  ✓ Existing users cleared");
    }

    console.log("  ↪ Creating new users...");
    const [rcfUser, devUser] = await Promise.all([
      clerk.users.createUser({
        emailAddress: ["rcf@rcf.com"],
        username: "rustconveyorfilters",
        firstName: "Rust Conveyor Filters",
        password: "worldsstrongestpassword",
        skipPasswordChecks: true,
        publicMetadata: {
          verifiedType: "official",
        },
      }),
      clerk.users.createUser({
        emailAddress: ["dev@rcf.com"],
        username: "developer",
        firstName: "Developer",
        password: "developer@rcf",
        skipPasswordChecks: true,
        publicMetadata: {
          verifiedType: "contributor",
        },
      }),
    ]);

    console.log("  ✓ Created users:");
    console.table(
      [rcfUser, devUser].map((user) => ({
        name: user.fullName,
        id: user.id,
        type: user.publicMetadata.verifiedType,
      })),
    );
    return [rcfUser.id, devUser.id];
  } catch (error) {
    throw new SeedError("Failed to create Clerk users", error);
  }
};

const insertItems = async () => {
  try {
    console.log("\n📦 Inserting items...");
    const values = loadJson<Item[]>("seed-data/items.json");
    console.log(`  ↪ Found ${values.length} items to insert`);
    await db.insert(items).values(
      values.map(({ id, ...rest }) => ({
        ...rest,
      })),
    );
    console.log("  ✓ Items inserted successfully");
  } catch (error) {
    throw new SeedError("Failed to insert items", error);
  }
};

const insertCategories = async () => {
  try {
    console.log("\n📦 Inserting categories...");
    const values = loadJson<Category[]>("seed-data/categories.json");
    console.log(`  ↪ Found ${values.length} categories to insert`);
    await db.insert(categories).values(values);
    console.log("  ✓ Categories inserted successfully");
  } catch (error) {
    throw new SeedError("Failed to insert categories", error);
  }
};

type UserIds = [rcfId: string, devId: string];
type CategoryIdMap = Map<string, Map<number, number>>;
type FilterIdMap = Map<string, Map<number, number>>;

const insertUserCategories = async ([rcfId, devId]: UserIds) => {
  try {
    console.log("\n📦 Inserting user categories...");
    const values = loadJson<UserCategory[]>("seed-data/user_categories.json");
    console.log(`  ↪ Found ${values.length} categories per user to insert`);

    // Map to store old ID to new ID for each user
    const categoryIdMap = new Map<string, Map<number, number>>();
    categoryIdMap.set(rcfId, new Map());
    categoryIdMap.set(devId, new Map());

    const rcfCategories = await db
      .insert(userCategories)
      .values(
        values.map(({ id, ...value }) => ({
          ...value,
          userId: rcfId,
        })),
      )
      .returning();

    // Map old IDs to new IDs for RCF user
    rcfCategories.forEach((category, index) => {
      categoryIdMap.get(rcfId)!.set(values[index].id, category.id);
    });

    const devCategories = await db
      .insert(userCategories)
      .values(
        values.map(({ id, ...value }) => ({
          ...value,
          userId: devId,
        })),
      )
      .returning();

    // Map old IDs to new IDs for Dev user
    devCategories.forEach((category, index) => {
      categoryIdMap.get(devId)!.set(values[index].id, category.id);
    });

    console.log(
      `  ✓ ${rcfCategories.length + devCategories.length} user categories inserted successfully`,
    );
    return categoryIdMap;
  } catch (error) {
    throw new SeedError("Failed to insert user categories", error);
  }
};

const insertFilters = async (
  [rcfId, devId]: UserIds,
  categoryIdMap: CategoryIdMap,
) => {
  try {
    console.log("\n📦 Inserting filters...");
    const values = loadJson<Filter[]>("seed-data/filters.json");
    console.log(`  ↪ Found ${values.length} filters per user to insert`);

    // Map to store old ID to new ID mapping for each user
    const filterIdMap = new Map<string, Map<number, number>>();
    filterIdMap.set(rcfId, new Map());
    filterIdMap.set(devId, new Map());

    const rcfFilters = await db
      .insert(filters)
      .values(
        values.map(({ id, categoryId, ...value }) => ({
          ...value,
          categoryId: categoryId
            ? categoryIdMap.get(rcfId)!.get(categoryId)
            : null,
          isPublic: true, // RCF filters are public
          createdAt: new Date(value.createdAt),
          updatedAt: new Date(value.updatedAt),
          authorId: rcfId,
        })),
      )
      .returning();

    // Map old IDs to new IDs for RCF user
    rcfFilters.forEach((filter, index) => {
      filterIdMap.get(rcfId)!.set(values[index].id, filter.id);
    });

    const devFilters = await db
      .insert(filters)
      .values(
        values.map(({ id, categoryId, ...value }) => ({
          ...value,
          categoryId: categoryId
            ? categoryIdMap.get(devId)!.get(categoryId)
            : null,
          isPublic: false, // Dev filters are private
          createdAt: new Date(value.createdAt),
          updatedAt: new Date(value.updatedAt),
          authorId: devId,
        })),
      )
      .returning();

    // Map old IDs to new IDs for Dev user
    devFilters.forEach((filter, index) => {
      filterIdMap.get(devId)!.set(values[index].id, filter.id);
    });

    console.log(
      `  ✓ ${rcfFilters.length + devFilters.length} filters inserted successfully`,
    );
    return filterIdMap;
  } catch (error) {
    throw new SeedError("Failed to insert filters", error);
  }
};

const insertFilterItems = async (
  [rcfId, devId]: UserIds,
  filterIdMap: FilterIdMap,
) => {
  try {
    console.log("\n📦 Inserting filter items...");
    const values = loadJson<FilterItem[]>("seed-data/filter_items.json");
    console.log(`  ↪ Found ${values.length} filter items per user to insert`);

    // Create filter items for both users
    const rcfFilterItems = values.map(({ id, filterId, ...value }) => ({
      ...value,
      filterId: filterIdMap.get(rcfId)!.get(filterId)!, // Map to RCF user's filter ID
      createdAt: new Date(value.createdAt),
      updatedAt: new Date(value.updatedAt),
      authorId: rcfId,
    }));

    const devFilterItems = values.map(({ id, filterId, ...value }) => ({
      ...value,
      filterId: filterIdMap.get(devId)!.get(filterId)!, // Map to Dev user's filter ID
      createdAt: new Date(value.createdAt),
      updatedAt: new Date(value.updatedAt),
      authorId: devId,
    }));

    await db.insert(filterItems).values([...rcfFilterItems, ...devFilterItems]);
    console.log(
      `  ✓ ${rcfFilterItems.length + devFilterItems.length} filter items inserted successfully`,
    );
  } catch (error) {
    throw new SeedError("Failed to insert filter items", error);
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
