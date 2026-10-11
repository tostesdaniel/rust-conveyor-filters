import { SEED_TAGS } from "@/scripts/ai-tags/taxonomy";
import type { ItemSnapshot, SnapshotItem } from "@/scripts/items/snapshot";
import { describe, expect, it } from "vitest";

import itemSnapshot from "./item-snapshot.json";
import {
  findSeedProblems,
  loadSeedAccounts,
  type SeedAccount,
} from "./seed-accounts";
import categories from "./seed-data/categories.json";

const snapshotItems = (itemSnapshot as ItemSnapshot).items;
const categoryNames = categories.map((c) => c.name);
const tagSlugs = SEED_TAGS.map((t) => t.slug);

function check(accounts: SeedAccount[], items: SnapshotItem[] = snapshotItems) {
  return findSeedProblems(accounts, items, categoryNames, tagSlugs);
}

function account(overrides: Partial<SeedAccount> = {}): SeedAccount {
  return {
    account: {
      username: "tester",
      firstName: "Tester",
      email: "tester@rcf.com",
      password: "tester@rcf",
    },
    categories: [{ name: "Box", subCategories: ["Left"] }],
    filters: [
      {
        key: "wood",
        name: "Wood",
        imagePath: "wood",
        isPublic: true,
        category: "Box",
        subCategory: "Left",
        outputContainer: "box.wooden",
        views: 0,
        exports: 0,
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
        tags: ["resources"],
        items: [{ item: "wood" }, { category: "Components" }],
      },
    ],
    ...overrides,
  };
}

describe("seed accounts", () => {
  it("only reference insertable items, known tags and real accounts", () => {
    expect(check(loadSeedAccounts())).toEqual([]);
  });

  it("includes the RCF and developer accounts", () => {
    const usernames = loadSeedAccounts().map((a) => a.account.username);
    expect(usernames).toEqual(
      expect.arrayContaining(["rustconveyorfilters", "developer"]),
    );
  });

  it("accepts a valid account", () => {
    expect(check([account()])).toEqual([]);
  });

  it("flags an item the snapshot no longer has", () => {
    const withoutWood = snapshotItems.filter((i) => i.shortname !== "wood");
    expect(check([account()], withoutWood)).toEqual([
      "tester/wood: unknown image wood",
      "tester/wood: wood is not insertable",
    ]);
  });

  it("flags an item that stopped being insertable", () => {
    const hiddenWood = snapshotItems.map((i) =>
      i.shortname === "wood" ? { ...i, insertable: false } : i,
    );
    expect(check([account()], hiddenWood)).toEqual([
      "tester/wood: wood is not insertable",
    ]);
  });

  it("flags an output container the app does not support", () => {
    const [filter] = account().filters;
    expect(
      check([account({ filters: [{ ...filter, outputContainer: "wood" }] })]),
    ).toEqual(["tester/wood: bad output container wood"]);
  });

  it("flags unknown tags, categories and sub-categories", () => {
    const [filter] = account().filters;
    expect(
      check([
        account({
          filters: [
            {
              ...filter,
              category: "Box",
              subCategory: "Right",
              tags: ["nope"],
              items: [{ category: "Nope" }],
            },
          ],
        }),
      ]),
    ).toEqual([
      "tester/wood: sub-category Right is not under Box",
      "tester/wood: unknown tag nope",
      "tester/wood: unknown category Nope",
    ]);
  });

  it("flags forks and shares that point nowhere", () => {
    const [filter] = account().filters;
    expect(
      check([
        account({
          filters: [
            { ...filter, forkedFrom: { username: "tester", key: "gone" } },
          ],
          shares: [{ to: "nobody", filters: ["missing"] }],
        }),
      ]),
    ).toEqual([
      "tester/wood: fork source not found",
      "tester shares with unknown nobody",
      "tester shares unknown filter missing",
    ]);
  });

  it("flags an item listed twice in one filter", () => {
    const [filter] = account().filters;
    expect(
      check([
        account({
          filters: [{ ...filter, items: [{ item: "wood" }, { item: "wood" }] }],
        }),
      ]),
    ).toEqual(["tester/wood: wood listed twice"]);
  });
});
