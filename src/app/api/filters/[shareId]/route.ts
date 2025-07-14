import { NextResponse } from "next/server";
import { db } from "@/db";
import { and, eq } from "drizzle-orm";

import { filters } from "@/db/schema";

import { enrichWithAuthor } from "../../../../utils/enrich-filter";

/**
 * Handles GET requests to retrieve a public filter by its share ID.
 *
 * Parses the share ID from the request parameters, validates it, and fetches the corresponding public filter from the database along with its related items and categories. If found, enriches the filter with author information and returns it as JSON. Returns appropriate error responses if the ID is invalid, the filter is not found or private, or if an internal error occurs.
 */
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
