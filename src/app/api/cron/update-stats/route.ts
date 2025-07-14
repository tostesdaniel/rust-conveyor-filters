import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateRepoStars } from "@/services/github-api";
import { updateGameHours } from "@/services/steam-api";

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
