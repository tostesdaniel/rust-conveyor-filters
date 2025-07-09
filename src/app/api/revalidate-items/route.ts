import { revalidateTag } from "next/cache";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const revalidateSecret = process.env.REVALIDATE_SECRET;

    if (!revalidateSecret) {
      return Response.json(
        { error: "Revalidation secret not set" },
        { status: 500 },
      );
    }

    if (authHeader !== `Bearer ${revalidateSecret}`) {
      console.log("❌ Unauthorized revalidation attempt");
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🔄 Revalidating items cache...");

    revalidateTag("items");

    console.log("✅ Items cache revalidated successfully");

    return Response.json({
      message: "Items cache invalidated successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Error invalidating cache:", error);
    return Response.json(
      {
        error: "Failed to invalidate cache",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
