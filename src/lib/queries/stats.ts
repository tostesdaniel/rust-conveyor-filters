import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";
import { db } from "@/db";
import { clerkClient } from "@clerk/nextjs/server";

import { Stat } from "@/types/stats";
import { filterItems, filters } from "@/db/schema";

export const getHeroStats = unstable_cache(
  async (): Promise<Stat[]> => {
    const client = await clerkClient();

    try {
      const [userCount, filterCount, filterItemsCount] = await Promise.all([
        client.users.getCount(),
        db.$count(filters),
        db.$count(filterItems),
      ]);

      return [
        { name: "Bases automated", value: userCount, icon: "users" },
        { name: "Filters created", value: filterCount, icon: "box" },
        {
          name: "Items automatically sorted",
          value: filterItemsCount,
          icon: "boxes",
        },
      ];
    } catch (error) {
      return [
        { name: "Bases automated", value: 400, icon: "users" },
        { name: "Filters created", value: 1900, icon: "box" },
        { name: "Items automatically sorted", value: 17000, icon: "boxes" },
      ];
    }
  },
  ["hero-stats"],
  {
    revalidate: 3600,
  },
);
