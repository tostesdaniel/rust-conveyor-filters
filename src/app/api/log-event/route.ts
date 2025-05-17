import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { Ratelimit } from "@upstash/ratelimit";
import type { Redis } from "@upstash/redis";
import { ipAddress } from "@vercel/functions";

import { getRedisClient } from "@/lib/redis";

export async function POST(req: NextRequest) {
  const redis = (await getRedisClient()) as Redis;
  const rateLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(1, "5m"),
  });

  const { userId } = await auth();
  const { filterId, eventType } = (await req.json()) as {
    filterId: string;
    eventType: string;
  };
  const ip = req.headers.get("x-forwarded-for") || ipAddress(req);
  const key = userId
    ? `${userId}:${filterId}:${eventType}`
    : `${ip}:${filterId}:${eventType}`;
  const { success } = await rateLimit.limit(key);

  return NextResponse.json({ success, userId, ip });
}
