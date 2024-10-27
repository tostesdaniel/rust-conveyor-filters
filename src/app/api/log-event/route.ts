import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { Ratelimit } from "@upstash/ratelimit";
import { kv } from "@vercel/kv";

const rateLimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.fixedWindow(1, "5m"),
});

export async function POST(req: NextRequest) {
  const { userId } = auth();
  const { filterId, eventType } = await req.json();
  const ip = req.headers.get("x-forwarded-for") || req.ip;
  const key = userId
    ? `${userId}:${filterId}:${eventType}`
    : `${ip}:${filterId}:${eventType}`;
  const { success } = await rateLimit.limit(key);

  return NextResponse.json({ success, userId, ip });
}
