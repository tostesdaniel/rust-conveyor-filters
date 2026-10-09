import * as fs from "fs";
import path from "path";
import type { SnapshotItem } from "@/scripts/items/snapshot";

import { isOutputContainer } from "@/lib/output-containers/container-table";

export type SeedFilterRow = { max?: number; buffer?: number; min?: number } & (
  | { item: string }
  | { category: string }
);

export interface SeedFilter {
  key: string;
  name: string;
  description?: string;
  imagePath: string;
  isPublic: boolean;
  category?: string;
  subCategory?: string;
  outputContainer?: string;
  forkedFrom?: { username: string; key: string };
  views: number;
  exports: number;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  items: SeedFilterRow[];
}

export interface SeedAccount {
  account: {
    username: string;
    firstName: string;
    email: string;
    password: string;
    verifiedType?: "official" | "contributor";
  };
  categories: { name: string; subCategories: string[] }[];
  filters: SeedFilter[];
  shares?: { to: string; filters: string[] }[];
}

export const SEED_ACCOUNTS_DIR = path.join(__dirname, "seed-data", "accounts");

export function loadSeedAccounts(dir = SEED_ACCOUNTS_DIR): SeedAccount[] {
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .sort()
    .map((file) => JSON.parse(fs.readFileSync(path.join(dir, file), "utf-8")));
}

export function findSeedProblems(
  accounts: SeedAccount[],
  snapshotItems: SnapshotItem[],
  itemCategories: string[],
  tagSlugs: string[],
): string[] {
  const problems: string[] = [];
  const items = new Map(snapshotItems.map((item) => [item.shortname, item]));
  const categoryNames = new Set(itemCategories);
  const tags = new Set(tagSlugs);
  const filterKeys = new Map(
    accounts.map((a) => [
      a.account.username,
      new Set(a.filters.map((f) => f.key)),
    ]),
  );

  const usernames = accounts.map((a) => a.account.username);
  if (new Set(usernames).size !== usernames.length) {
    problems.push("Two seed accounts share a username");
  }

  for (const { account, categories, filters, shares = [] } of accounts) {
    const where = (filter: SeedFilter) => `${account.username}/${filter.key}`;
    const subCategories = new Map(
      categories.map((c) => [c.name, new Set(c.subCategories)]),
    );

    if (filterKeys.get(account.username)!.size !== filters.length) {
      problems.push(`${account.username} has duplicate filter keys`);
    }

    for (const filter of filters) {
      if (!items.has(filter.imagePath)) {
        problems.push(`${where(filter)}: unknown image ${filter.imagePath}`);
      }

      if (filter.category && !subCategories.has(filter.category)) {
        problems.push(
          `${where(filter)}: undeclared category ${filter.category}`,
        );
      }
      if (
        filter.subCategory &&
        !subCategories.get(filter.category ?? "")?.has(filter.subCategory)
      ) {
        problems.push(
          `${where(filter)}: sub-category ${filter.subCategory} is not under ${filter.category}`,
        );
      }

      const container = filter.outputContainer;
      if (
        container &&
        (!items.get(container)?.insertable || !isOutputContainer(container))
      ) {
        problems.push(`${where(filter)}: bad output container ${container}`);
      }

      if (
        filter.forkedFrom &&
        !filterKeys.get(filter.forkedFrom.username)?.has(filter.forkedFrom.key)
      ) {
        problems.push(`${where(filter)}: fork source not found`);
      }

      for (const tag of filter.tags) {
        if (!tags.has(tag))
          problems.push(`${where(filter)}: unknown tag ${tag}`);
      }

      if (filter.items.length === 0) {
        problems.push(`${where(filter)}: no items`);
      }
      const seen = new Set<string>();
      for (const row of filter.items) {
        const id = "item" in row ? row.item : `category:${row.category}`;
        if (seen.has(id)) problems.push(`${where(filter)}: ${id} listed twice`);
        seen.add(id);

        if ("item" in row && !items.get(row.item)?.insertable) {
          problems.push(`${where(filter)}: ${row.item} is not insertable`);
        }
        if ("category" in row && !categoryNames.has(row.category)) {
          problems.push(`${where(filter)}: unknown category ${row.category}`);
        }
      }
    }

    for (const share of shares) {
      if (!filterKeys.has(share.to)) {
        problems.push(`${account.username} shares with unknown ${share.to}`);
      }
      for (const key of share.filters) {
        if (!filterKeys.get(account.username)!.has(key)) {
          problems.push(`${account.username} shares unknown filter ${key}`);
        }
      }
    }
  }

  return problems;
}
