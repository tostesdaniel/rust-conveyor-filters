/**
 * Facepunch's news feed, used only to put the update's name on the Discord
 * post.
 */
const FEED_URL = "https://rust.facepunch.com/rss/news";
const FEED_TIMEOUT_MS = 5000;

export interface RustNewsPost {
  title: string;
  link: string;
  publishedAt: Date;
}

/** First `<item>` only. The feed is newest first. */
export function parseLatestPost(xml: string): RustNewsPost | null {
  const item = xml.match(/<item>([\s\S]*?)<\/item>/)?.[1];
  if (!item) return null;

  const tag = (name: string) =>
    item
      .match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`))?.[1]
      ?.replace(/^<!\[CDATA\[([\s\S]*?)\]\]>$/, "$1")
      .trim();

  const title = tag("title");
  const link = tag("link");
  const published = tag("pubDate");
  if (!title || !link) return null;

  const publishedAt = published ? new Date(published) : new Date(NaN);
  return { title, link, publishedAt };
}

/**
 * The newest post, when it's recent enough to be the reason items changed.
 * Returns null rather than failing the announcement, since the title is
 * decoration.
 */
export async function fetchLatestRustNews(
  maxAgeMs = 10 * 24 * 60 * 60 * 1000,
): Promise<RustNewsPost | null> {
  try {
    const res = await fetch(FEED_URL, {
      signal: AbortSignal.timeout(FEED_TIMEOUT_MS),
    });
    if (!res.ok) return null;

    const post = parseLatestPost(await res.text());
    if (!post || Number.isNaN(post.publishedAt.getTime())) return null;
    return Date.now() - post.publishedAt.getTime() <= maxAgeMs ? post : null;
  } catch {
    return null;
  }
}
