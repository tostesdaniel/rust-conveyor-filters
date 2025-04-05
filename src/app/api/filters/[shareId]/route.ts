import { NextResponse } from "next/server";
import { db } from "@/db";
import { and, eq } from "drizzle-orm";

import { enrichWithAuthor } from "@/lib/utils/enrich-filter";
import { filters } from "@/db/schema";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ shareId: string }> },
) {
  try {
    const { shareId } = await params;
    const filterId = parseInt(shareId);
    if (isNaN(filterId)) {
      return NextResponse.json({ error: "Invalid filter ID" }, { status: 400 });
    }

    const filter = await db.query.filters.findFirst({
      where: and(eq(filters.id, filterId), eq(filters.isPublic, true)),
      with: {
        filterItems: {
          with: { item: true, category: true },
        },
      },
    });

    if (!filter) {
      return NextResponse.json(
        { error: "Filter not found or is private" },
        { status: 404 },
      );
    }

    const [enrichedFilter] = await enrichWithAuthor([filter]);

    return NextResponse.json(enrichedFilter);
  } catch (error) {
    console.error("Error fetching filter:", error);
    return NextResponse.json(
      { error: "Failed to fetch filter" },
      { status: 500 },
    );
  }
}
