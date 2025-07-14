import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateRepoStars } from "@/services/github-api";
import { updateGameHours } from "@/services/steam-api";

/**
 * Handles a GET request to update game hours and repository stars, requiring authorization.
 *
 * Validates the request using a secret token from the `authorization` header. If authorized, concurrently updates game hours and repository stars, returning the results in a JSON response. Responds with 401 if unauthorized, or 500 if an error occurs during the update process.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const [gameHours, repoStars] = await Promise.all([
      updateGameHours(),
      updateRepoStars(),
    ]);

    return NextResponse.json(
      { success: true, gameHours, repoStars },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating stats:", error);
    return NextResponse.json(
      { error: "Failed to update stats" },
      { status: 500 },
    );
  }
}
