import { describe, expect, it } from "vitest";

import {
  planOutputContainer,
  type PlannerRow,
} from "@/lib/output-containers/capacity-planner";
import { OUTPUT_CONTAINERS } from "@/lib/output-containers/container-table";

const largeBox = OUTPUT_CONTAINERS["box.wooden.large"];

function item(
  shortname: string,
  stackSize: number,
  max = 0,
  itemType: "Generic" | "Liquid" = "Generic",
): PlannerRow {
  return { kind: "item", shortname, stackSize, itemType, max };
}

const fragments = (max = 0) => item("metal.fragments", 1000, max);
const wood = (max = 0) => item("wood", 1000, max);
const stones = (max = 0) => item("stones", 1000, max);
const sulfur = (max = 0) => item("sulfur", 1000, max);
const hqMetal = (max = 0) => item("metal.refined", 100, max);

describe("planOutputContainer on plain boxes", () => {
  it.each([
    ["box.wooden.large", 48],
    ["coffin.storage", 48],
    ["storage_barrel_b", 48],
    ["wicker.barrel", 48],
    ["krieg.storage.vertical", 48],
    ["vending.machine", 30],
    ["box.wooden", 18],
    ["electric.wallcabinet", 18],
  ] as const)(
    "fills %s with %i stacks of one uncapped row",
    (shortname, slots) => {
      const [plan] = planOutputContainer(OUTPUT_CONTAINERS[shortname], [
        wood(),
      ]);

      expect(plan.max).toBe(slots * 1000);
    },
  );
});

describe("planOutputContainer on a large wood box", () => {
  it("keeps a capped row and splits the rest by stack size, remainder to the top", () => {
    const plan = planOutputContainer(largeBox, [
      fragments(5000),
      wood(),
      stones(),
      sulfur(),
      hqMetal(),
    ]);

    expect(plan.map((row) => row.max)).toEqual([
      5000, 11000, 11000, 11000, 1000,
    ]);
  });

  it("gives every row the share it would get if it were left at 0", () => {
    const plan = planOutputContainer(largeBox, [
      fragments(5000),
      wood(),
      stones(),
      sulfur(),
      hqMetal(),
    ]);

    expect(plan.map((row) => row.splitShare)).toEqual([
      10000, 11000, 11000, 11000, 1000,
    ]);
    expect(plan.some((row) => row.aboveShare)).toBe(false);
  });

  it("flags a Max typed above the row's share after a split", () => {
    const plan = planOutputContainer(largeBox, [
      fragments(5000),
      wood(20000),
      stones(11000),
      sulfur(11000),
      hqMetal(1000),
    ]);

    expect(plan[1]).toMatchObject({
      max: 20000,
      splitShare: 11000,
      aboveShare: true,
    });
  });

  it("gives a row with no slots left one stack and the shares-slots flag", () => {
    const plan = planOutputContainer(largeBox, [fragments(48000), wood()]);

    expect(plan[1]).toMatchObject({ max: 1000, sharesSlots: true });
    expect(plan[0]).toMatchObject({ sharesSlots: false });
  });

  it("keeps a capped row's Max and leaves the shares-slots flag off when others fill the box", () => {
    const plan = planOutputContainer(largeBox, [fragments(48000), wood(3000)]);

    expect(plan[1]).toMatchObject({
      max: 3000,
      sharesSlots: false,
      aboveShare: true,
    });
  });

  it("proposes the Row capacity for a Max above what the box can hold", () => {
    const [plan] = planOutputContainer(largeBox, [wood(60000)]);

    expect(plan).toMatchObject({
      max: 48000,
      rowCapacity: 48000,
      aboveCapacity: true,
    });
  });

  it("doesn't flag a Max the box can hold", () => {
    const [plan] = planOutputContainer(largeBox, [wood(48000)]);

    expect(plan).toMatchObject({ max: 48000, aboveCapacity: false });
  });

  it("flags a water row as not accepted, keeps its Max and leaves it out of the split", () => {
    const plan = planOutputContainer(largeBox, [
      item("water", 1000, 500, "Liquid"),
      wood(),
    ]);

    expect(plan[0]).toMatchObject({
      max: 500,
      notAccepted: true,
      slotGroup: null,
      rowCapacity: null,
    });
    expect(plan[1]).toMatchObject({ max: 48000, notAccepted: false });
  });
});
