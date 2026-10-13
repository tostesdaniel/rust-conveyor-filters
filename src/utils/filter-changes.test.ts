import {
  changedItemRows,
  isContentChange,
  type FilterContent,
} from "@/utils/filter-changes";
import { describe, expect, it } from "vitest";

const current: FilterContent = {
  name: "Boom",
  description: null,
  imagePath: "rocket.png",
  outputContainerId: 7,
  isPublic: false,
};

describe("isContentChange", () => {
  it("ignores an empty edit", () => {
    expect(isContentChange(current, {})).toBe(false);
  });

  it("ignores fields resent with the same value", () => {
    expect(
      isContentChange(current, {
        name: "Boom",
        description: "",
        imagePath: "rocket.png",
        outputContainerId: 7,
        isPublic: false,
      }),
    ).toBe(false);
  });

  it.each([
    ["name", { name: "Kaboom" }],
    ["description", { description: "Rockets only" }],
    ["image", { imagePath: "c4.png" }],
    ["output container", { outputContainerId: null }],
  ])("counts a %s edit", (_, next) => {
    expect(isContentChange(current, next)).toBe(true);
  });

  it("counts publishing", () => {
    expect(isContentChange(current, { isPublic: true })).toBe(true);
  });

  it("ignores unpublishing", () => {
    expect(
      isContentChange({ ...current, isPublic: true }, { isPublic: false }),
    ).toBe(false);
  });
});

describe("changedItemRows", () => {
  const stored = [
    { itemId: 1, categoryId: null, max: 10, buffer: 0, min: 0, position: 0 },
    { itemId: null, categoryId: 3, max: 0, buffer: 0, min: 0, position: 1 },
  ];

  it("returns nothing when every row matches", () => {
    expect(changedItemRows(stored, stored)).toEqual([]);
  });

  it("returns rows with different limits", () => {
    const edited = { ...stored[0], max: 20 };
    expect(changedItemRows(stored, [edited, stored[1]])).toEqual([edited]);
  });

  it("matches category rows by category", () => {
    const edited = { ...stored[1], buffer: 5 };
    expect(changedItemRows(stored, [stored[0], edited])).toEqual([edited]);
  });

  it("returns rows that moved", () => {
    const moved = [
      { ...stored[1], position: 0 },
      { ...stored[0], position: 1 },
    ];
    expect(changedItemRows(stored, moved)).toEqual(moved);
  });
});
