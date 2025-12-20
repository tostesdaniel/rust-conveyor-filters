import "server-only";

import { db } from "@/db";
import { clerkClient } from "@clerk/nextjs/server";

import { filterItems, filters } from "@/db/schema";

export interface HeroStat {
  name: string;
  value: number;
  icon: "users" | "box" | "boxes";
}

export async function getHeroStats(): Promise<HeroStat[]> {
  const client = await clerkClient();
  const [userCount, filterCount, filterItemsCount] = await Promise.all([
    client.users.getCount(),
    db.$count(filters),
    db.$count(filterItems),
  ]);

  return [
    {
      name: "Bases automated",
      value: userCount,
      icon: "users",
    },
    {
      name: "Filters created",
      value: filterCount,
      icon: "box",
    },
    {
      name: "Items automatically sorted",
      value: filterItemsCount,
      icon: "boxes",
    },
  ];
}
