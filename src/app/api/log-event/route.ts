import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Ratelimit } from "@upstash/ratelimit";

import { getRedisClient } from "@/lib/redis";

export async function POST(req: NextRequest) {
  const { ctx } = getCloudflareContext();
  const redis = await getRedisClient();
  const rateLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(1, "5m"),
  });

  const { userId } = await auth();
  const { filterId, eventType } = (await req.json()) as {
    filterId: string;
    eventType: string;
  };
  const ip =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("cf-connecting-ip") ||
    "unknown";
  const key = userId
    ? `${userId}:${filterId}:${eventType}`
    : `${ip}:${filterId}:${eventType}`;
  const { pending } = await rateLimit.limit(key);
  ctx.waitUntil(pending);

  return NextResponse.json({ success: true, userId, ip });
}
