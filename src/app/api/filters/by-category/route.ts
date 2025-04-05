import { NextResponse } from "next/server";
import { db } from "@/db";
import { auth } from "@clerk/nextjs/server";
import { and, eq, isNull } from "drizzle-orm";

import { filters } from "@/db/schema";

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const parsedCategoryId = categoryId ? parseInt(categoryId) : null;

    const whereClause =
      parsedCategoryId !== null
        ? and(
            eq(filters.categoryId, parsedCategoryId),
            eq(filters.authorId, userId),
          )
        : and(isNull(filters.categoryId), eq(filters.authorId, userId));

    const result = await db.query.filters.findMany({
      where: whereClause,
      with: {
        filterItems: {
          with: { item: true, category: true },
          orderBy: ({ createdAt, id }) => [id, createdAt],
        },
      },
      orderBy: filters.order,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching filters by category:", error);
    return NextResponse.json(
      { error: "Failed to fetch filters" },
      { status: 500 },
    );
  }
}
