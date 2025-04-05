import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const rateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.fixedWindow(1, "5m"),
});

export async function POST(req: NextRequest) {
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
  const { success } = await rateLimit.limit(key);

  return NextResponse.json({ success, userId, ip });
}
