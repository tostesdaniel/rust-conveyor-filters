import { db } from "@/db";
import { clerkClient } from "@clerk/nextjs/server";

import { filterItems, filters } from "@/db/schema";

interface Stat {
  name: string;
  value: number;
  icon: "users" | "box" | "boxes";
}

export interface HeroStatsResponse {
  stats: Stat[];
}

export async function GET() {
  const client = await clerkClient();
  try {
    const [userCount, filterCount, filterItemsCount] = await Promise.all([
      client.users.getCount(),
      db.$count(filters),
      db.$count(filterItems),
    ]);

    const stats: Stat[] = [
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

    return Response.json({
      stats,
    });
  } catch (error) {
    return Response.json(
      { error: "Failed to fetch hero stats" },
      { status: 500 },
    );
  }
}
