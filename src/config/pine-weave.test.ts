import { describe, expect, it } from "vitest";

import { planWovenGrid, weaveBands, type WovenItem } from "./pine-weave";
import type { PineCadence, PineCreative } from "./pine";

const CADENCE: PineCadence = { firstOffset: 6, growthStep: 4 };

/** A minimal creative; only its presence in the array matters to the planner. */
const CREATIVE = {} as PineCreative;

/** Build a list of `n` distinct filters, each just an id for identity checks. */
function filters(n: number): { id: number }[] {
  return Array.from({ length: n }, (_, i) => ({ id: i + 1 }));
}

/** Positions (1-based) of band items within the woven list. */
function bandPositions(items: WovenItem<unknown>[]): number[] {
  return items
    .map((item, index) => (item.kind === "band" ? index : -1))
    .filter((index) => index !== -1)
    .map((index) => index + 1);
}

/** Real filters that precede each band, counting filters only. */
function filtersBeforeEachBand(items: WovenItem<unknown>[]): number[] {
  const offsets: number[] = [];
  let seenFilters = 0;
  for (const item of items) {
    if (item.kind === "filter") seenFilters += 1;
    else offsets.push(seenFilters);
  }
  return offsets;
}

describe("weaveBands", () => {
  it("inserts no bands into an empty filter list", () => {
    expect(weaveBands(filters(0), CADENCE, 1)).toEqual([]);
  });

  it("inserts exactly one band at the boundary when given firstOffset filters", () => {
    const woven = weaveBands(filters(CADENCE.firstOffset), CADENCE, 1);

    expect(bandPositions(woven)).toEqual([CADENCE.firstOffset + 1]);
    expect(filtersBeforeEachBand(woven)).toEqual([CADENCE.firstOffset]);
  });

  it("inserts no band when there are fewer filters than firstOffset", () => {
    const woven = weaveBands(filters(CADENCE.firstOffset - 1), CADENCE, 1);
    expect(filtersBeforeEachBand(woven)).toEqual([]);
  });

  it("lands bands after filters 6, 16, 30, 48, 70 on a long list", () => {
    const woven = weaveBands(filters(80), CADENCE, 1);
    expect(filtersBeforeEachBand(woven)).toEqual([6, 16, 30, 48, 70]);
  });

  it("gives each band a stable, unique key derived from its ordinal", () => {
    const keys = weaveBands(filters(80), CADENCE, 1)
      .filter((item) => item.kind === "band")
      .map((item) => item.key);

    expect(keys).toEqual([
      "pine-band-0",
      "pine-band-1",
      "pine-band-2",
      "pine-band-3",
      "pine-band-4",
    ]);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("round-robins the creative index and wraps over creativeCount", () => {
    const creativeIndices = weaveBands(filters(80), CADENCE, 3)
      .filter((item) => item.kind === "band")
      .map((item) => item.creativeIndex);

    // 5 bands over 3 creatives → 0, 1, 2, 0, 1
    expect(creativeIndices).toEqual([0, 1, 2, 0, 1]);
  });

  it("is deterministic: identical input yields identical output", () => {
    const input = filters(80);
    expect(weaveBands(input, CADENCE, 3)).toEqual(weaveBands(input, CADENCE, 3));
  });

  it("inserts no bands when no creatives are configured", () => {
    const woven = weaveBands(filters(80), CADENCE, 0);
    expect(woven.every((item) => item.kind === "filter")).toBe(true);
  });
});

describe("planWovenGrid", () => {
  const ENABLED = {
    enabled: true,
    cadence: CADENCE,
    creatives: [CREATIVE],
  };

  it("weaves no bands when disabled, however long the list", () => {
    const woven = planWovenGrid(filters(80), { ...ENABLED, enabled: false });
    expect(woven.every((item) => item.kind === "filter")).toBe(true);
  });

  it("weaves bands at the configured cadence when enabled", () => {
    const woven = planWovenGrid(filters(80), ENABLED);
    expect(filtersBeforeEachBand(woven)).toEqual([6, 16, 30, 48, 70]);
  });

  it("round-robins across the configured creatives when enabled", () => {
    const woven = planWovenGrid(filters(80), {
      ...ENABLED,
      creatives: [CREATIVE, CREATIVE, CREATIVE],
    });
    const indices = woven
      .filter((item) => item.kind === "band")
      .map((item) => item.creativeIndex);
    expect(indices).toEqual([0, 1, 2, 0, 1]);
  });
});
