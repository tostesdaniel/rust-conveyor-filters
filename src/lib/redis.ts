// import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Redis } from "@upstash/redis/cloudflare";

type RedisValue = string | number | boolean | null | undefined | object;

interface RedisClient {
  get<T extends RedisValue>(key: string): Promise<T | null>;
  set(key: string, value: RedisValue): Promise<"OK">;
  del(key: string): Promise<number>;
}

const MOCK_DATA: Record<string, RedisValue> = {
  "repo-stars": 30,
  gameHours: 6190,
};

class MockRedis implements RedisClient {
  private store: Map<string, RedisValue>;

  constructor(initialData: Record<string, RedisValue> = {}) {
    this.store = new Map(Object.entries(initialData));
  }

  async get<T extends RedisValue>(key: string): Promise<T | null> {
    return (this.store.get(key) as T) || null;
  }

  async set(key: string, value: RedisValue): Promise<"OK"> {
    this.store.set(key, value);
    return "OK";
  }

  async del(key: string): Promise<number> {
    return this.store.delete(key) ? 1 : 0;
  }
}

export async function getRedisClient(): Promise<RedisClient> {
  const IS_DEVELOPMENT = process.env.NODE_ENV === "development";
  const HAS_REDIS_CREDENTIALS =
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

  if (IS_DEVELOPMENT && !HAS_REDIS_CREDENTIALS) {
    return new MockRedis(MOCK_DATA);
  }

  if (!HAS_REDIS_CREDENTIALS) {
    throw new Error(
      "Redis credentials are required in production. Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables.",
    );
  }

  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  }) as RedisClient;
}
