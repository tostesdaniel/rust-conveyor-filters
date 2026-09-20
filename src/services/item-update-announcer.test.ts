import type { ItemUpdateChanges } from "@/db/item-changes";
import { describe, expect, it } from "vitest";

import {
  buildDescription,
  buildMessage,
  gridEntries,
} from "./item-update-announcer";

function changes(
  overrides: Partial<ItemUpdateChanges> = {},
): ItemUpdateChanges {
  return {
    manifestId: "4408100835840826754",
    added: [],
    removed: [],
    renamed: [],
    redrawn: [],
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

    expect(text).toContain("➕ New in the conveyor picker (45)");
    expect(text).toContain("and 5 more");
  });

  it("says what a merge means for a saved filter", () => {
    const text = buildDescription(
      changes({
        removed: [
          { shortname: "light.red", name: "Red Light", mergedInto: "Light" },
          { shortname: "mlrs", name: "MLRS", mergedInto: null },
        ],
        filtersChanged: 41,
      }),
    );

    expect(text).toContain("➡️ Merged into another item (1)");
    expect(text).toContain(
      "Filters with the following items now contain **Light** instead:\nRed Light",
    );
    expect(text).toContain("- MLRS");
    expect(text).not.toContain("now part of");
    expect(text).not.toContain("41 saved filters");
  });

  it("gives each merge target its own paragraph", () => {
    const text = buildDescription(
      changes({
        removed: [
          { shortname: "smgbody", name: "SMG Body", mergedInto: "Rifle Body" },
          {
            shortname: "semibody",
            name: "Semi Body",
            mergedInto: "Rifle Body",
          },
          { shortname: "pipe", name: "Pipe", mergedInto: "Tube" },
        ],
      }),
    );

    expect(text).toContain(
      "Filters with the following items now contain **Rifle Body** instead:\nSMG Body, Semi Body",
    );
    expect(text).toContain(
      "Filters with the following items now contain **Tube** instead:\nPipe",
    );
    // Blank line between groups, so several merges don't read as one wall.
    expect(text).toContain("SMG Body, Semi Body\n\nFilters with");
  });

  it("owns up to the bullets it cut, so the heading count adds up", () => {
    const removed = Array.from({ length: 24 }, (_, i) => ({
      shortname: `item.${i}`,
      name: `Item ${i}`,
      mergedInto: null,
    }));

    const text = buildDescription(changes({ removed }));

    expect(text).toContain("➖ Removed from the picker (24)");
    expect(text).toContain("- and 4 more");
  });

  it("counts redrawn icons rather than naming them", () => {
    const text = buildDescription(
      changes({
        redrawn: [
          { shortname: "gears", name: "Gears" },
          { shortname: "tarp", name: "Tarp" },
        ],
      }),
    );

    expect(text).toContain("🔄 2 icons now match");
    expect(text).not.toContain("Gears");
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
      url: "attachment://item-changes.png",
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

describe("gridEntries", () => {
  it("badges a merge apart from a plain removal", () => {
    const entries = gridEntries(
      changes({
        added: [{ shortname: "ak", name: "AK" }],
        removed: [
          { shortname: "smgbody", name: "SMG Body", mergedInto: "Rifle Body" },
          { shortname: "mlrs", name: "MLRS", mergedInto: null },
        ],
        redrawn: [{ shortname: "gears", name: "Gears" }],
      }),
    );

    expect(entries).toEqual([
      { shortname: "ak", kind: "added" },
      { shortname: "smgbody", kind: "merged" },
      { shortname: "mlrs", kind: "removed" },
      { shortname: "gears", kind: "redrawn" },
    ]);
  });
});
