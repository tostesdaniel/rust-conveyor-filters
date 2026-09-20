import { describe, expect, it } from "vitest";

import { parseLatestPost } from "./rust-news";

const feed = `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0"><channel>
  <title>Rust News</title>
  <lastBuildDate>Thu, 03 Sep 2026 18:45:00 Z</lastBuildDate>
  <item>
    <title><![CDATA[Breach and Clear]]></title>
    <link>https://rust.facepunch.com/news/breach-and-clear/</link>
    <pubDate>Thu, 03 Sep 2026 18:45:00 Z</pubDate>
  </item>
  <item>
    <title>Last month</title>
    <link>https://rust.facepunch.com/news/last-month/</link>
    <pubDate>Thu, 06 Aug 2026 18:00:00 Z</pubDate>
  </item>
</channel></rss>`;

describe("parseLatestPost", () => {
  it("reads the newest post and unwraps CDATA", () => {
    const post = parseLatestPost(feed);

    expect(post?.title).toBe("Breach and Clear");
    expect(post?.link).toBe(
      "https://rust.facepunch.com/news/breach-and-clear/",
    );
    expect(post?.publishedAt.toISOString()).toBe("2026-09-03T18:45:00.000Z");
  });

  it("returns null for a feed with no items", () => {
    expect(parseLatestPost("<rss><channel></channel></rss>")).toBeNull();
  });
});
