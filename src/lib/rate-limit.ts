import "server-only";

import { Ratelimit, type Duration } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export type RateLimitSpec = {
  prefix: string;
  tokens: number;
  window: Duration;
};

function getRatelimitRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

const limiters = new Map<string, Ratelimit>();

function getLimiter(spec: RateLimitSpec): Ratelimit | null {
  const cached = limiters.get(spec.prefix);
  if (cached) return cached;

  const redis = getRatelimitRedis();
  if (!redis) return null;

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(spec.tokens, spec.window),
    prefix: spec.prefix,
  });
  limiters.set(spec.prefix, limiter);
  return limiter;
}

export async function checkRateLimit(
  spec: RateLimitSpec,
  identifier: string,
): Promise<boolean> {
  const limiter = getLimiter(spec);
  if (!limiter) return true;

  try {
    const { success } = await limiter.limit(identifier);
    return success;
  } catch (error) {
    console.error(`[rate-limit] ${spec.prefix} check failed, allowing`, error);
    return true;
  }
}
