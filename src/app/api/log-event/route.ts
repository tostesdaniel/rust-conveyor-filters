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
  const { filterId, action } = await req.json();
  const ip = req.headers.get("x-forwarded-for") || req.ip;
  const key = userId
    ? `${userId}:${filterId}:${action}`
    : `${ip}:${filterId}:${action}`;
  const { success } = await rateLimit.limit(key);

  if (success) {
    return NextResponse.json({ shouldLog: true });
  } else {
    return NextResponse.json({ shouldLog: false });
  }
}
