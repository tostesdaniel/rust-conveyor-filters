import type { ItemUpdateChanges } from "@/db/item-changes";
import { describe, expect, it } from "vitest";

import { buildDescription, buildMessage } from "./item-update-announcer";

function changes(
  overrides: Partial<ItemUpdateChanges> = {},
): ItemUpdateChanges {
  return {
    manifestId: "4408100835840826754",
    added: [],
    removed: [],
    renamed: [],
    iconsRedrawn: 0,
    filtersChanged: 0,
    ...overrides,
  };
}

describe("buildDescription", () => {
  it("puts new items on one line and counts the overflow", () => {
    const added = Array.from({ length: 45 }, (_, i) => ({
      shortname: `item.${i}`,
      name: `Item ${i}`,
    }));

    const text = buildDescription(changes({ added }));

    expect(text).toContain("New in the conveyor picker (45)");
    expect(text).toContain("and 5 more");
  });

  it("says what a removed item was merged into", () => {
    const text = buildDescription(
      changes({
        removed: [
          { shortname: "light.red", name: "Red Light", mergedInto: "Light" },
          { shortname: "mlrs", name: "MLRS", mergedInto: null },
        ],
        filtersChanged: 41,
      }),
    );

    expect(text).toContain("- Red Light, now part of Light");
    expect(text).toContain("- MLRS");
    expect(text).toContain("41 saved filters");
  });

  it("escapes markdown in item names", () => {
    const text = buildDescription(
      changes({ added: [{ shortname: "x", name: "L*ght_" }] }),
    );

    expect(text).toContain("L\\*ght\\_");
  });

  it("stays inside Discord's description limit", () => {
    const renamed = Array.from({ length: 400 }, (_, i) => ({
      shortname: `item.${i}`,
      name: "N".repeat(60),
      from: "O".repeat(60),
    }));

    expect(buildDescription(changes({ renamed })).length).toBeLessThanOrEqual(
      4096,
    );
  });
});

describe("buildMessage", () => {
  it("pings only the item updates role", () => {
    const message = buildMessage({
      changes: changes({ added: [{ shortname: "ak", name: "AK" }] }),
      news: null,
      hasGrid: true,
      roleId: "1550824003323822210",
    });

    expect(message.content).toBe("<@&1550824003323822210>");
    expect(message.allowed_mentions).toEqual({
      parse: [],
      roles: ["1550824003323822210"],
    });
    expect(message.embeds[0].image).toEqual({
      url: "attachment://new-items.png",
    });
  });

  it("titles the post with the update's name and links to it", () => {
    const message = buildMessage({
      changes: changes(),
      news: {
        title: "Breach and Clear",
        link: "https://rust.facepunch.com/news/breach-and-clear/",
        publishedAt: new Date(),
      },
      hasGrid: false,
    });

    expect(message.embeds[0].title).toBe("Items updated: Breach and Clear");
    expect(message.embeds[0].url).toBe(
      "https://rust.facepunch.com/news/breach-and-clear/",
    );
    expect(message.embeds[0].image).toBeUndefined();
  });
});
