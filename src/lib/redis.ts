import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Redis } from "@upstash/redis/cloudflare";

export async function getRedisClient() {
  const { env } = await getCloudflareContext({ async: true });

  return new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });
}
