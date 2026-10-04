import { describe, expect, it } from "vitest";

import { OUTPUT_CONTAINERS } from "@/lib/output-containers/container-table";

import {
  hasSeenTour,
  maxChanges,
  ovenSampleShortnames,
  withSeenTour,
} from "./tours";

describe("hasSeenTour", () => {
  it("is false without metadata", () => {
    expect(hasSeenTour(undefined, "a")).toBe(false);
    expect(hasSeenTour({}, "a")).toBe(false);
  });

  it("is true only for listed tours", () => {
    expect(hasSeenTour({ seenTours: ["a"] }, "a")).toBe(true);
    expect(hasSeenTour({ seenTours: ["a"] }, "b")).toBe(false);
  });
});

describe("withSeenTour", () => {
  it("keeps other unsafe metadata keys", () => {
    const metadata = { seenTours: ["a"], other: 1 } as UserUnsafeMetadata;
    expect(withSeenTour(metadata, "b")).toEqual({
      seenTours: ["a", "b"],
      other: 1,
    });
  });

  it("does not add a tour twice", () => {
    expect(withSeenTour({ seenTours: ["a"] }, "a")).toEqual({
      seenTours: ["a"],
    });
  });

  it("starts the list when metadata is empty", () => {
    expect(withSeenTour(undefined, "a")).toEqual({ seenTours: ["a"] });
  });
});

describe("ovenSampleShortnames", () => {
  it("fills a furnace's fuel slot and both input slots", () => {
    expect(ovenSampleShortnames(OUTPUT_CONTAINERS.furnace)).toEqual([
      "wood",
      "metal.ore",
      "sulfur.ore",
    ]);
  });

  it("uses every Smelt item when the oven has room", () => {
    expect(ovenSampleShortnames(OUTPUT_CONTAINERS["furnace.large"])).toEqual([
      "wood",
      "metal.ore",
      "sulfur.ore",
      "hq.metal.ore",
    ]);
  });

  it("skips fuel for the electric furnace", () => {
    expect(ovenSampleShortnames(OUTPUT_CONTAINERS["electric.furnace"])).toEqual(
      ["metal.ore", "sulfur.ore"],
    );
  });

  it("uses crude oil for the refinery", () => {
    expect(
      ovenSampleShortnames(OUTPUT_CONTAINERS["small.oil.refinery"]),
    ).toEqual(["wood", "crude.oil"]);
  });
});

describe("maxChanges", () => {
  const wood = { itemId: 1, max: 0 };
  const stones = { itemId: 2, max: 0 };

  it("lists the rows whose Max changed", () => {
    expect(
      maxChanges([wood, stones], [wood, { ...stones, max: 12000 }]),
    ).toEqual([1]);
  });

  it("treats a string Max like its number", () => {
    expect(
      maxChanges([{ ...wood, max: "12000" }], [{ ...wood, max: 12000 }]),
    ).toEqual([]);
  });

  it("is null when the rows differ", () => {
    expect(maxChanges([wood, stones], [stones, wood])).toBeNull();
    expect(maxChanges([wood], [wood, stones])).toBeNull();
  });
});
