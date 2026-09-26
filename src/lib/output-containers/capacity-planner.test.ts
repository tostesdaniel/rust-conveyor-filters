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
const metalOre = (max = 0) => item("metal.ore", 1000, max);
const sulfurOre = (max = 0) => item("sulfur.ore", 1000, max);
const hqOre = (max = 0) => item("hq.metal.ore", 100, max);
const charcoal = (max = 0) => item("charcoal", 1000, max);

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

describe("planOutputContainer on ovens", () => {
  it("caps wood by the furnace's fuel slot and ore by its input slots", () => {
    const plan = planOutputContainer(OUTPUT_CONTAINERS.furnace, [
      wood(),
      metalOre(),
      sulfurOre(),
      fragments(),
      charcoal(),
    ]);

    expect(plan.map((row) => row.max)).toEqual([1000, 1000, 1000, 0, 0]);
    expect(plan.map((row) => row.slotGroup)).toEqual([
      "fuel",
      "input",
      "input",
      null,
      null,
    ]);
  });

  it("marks a furnace's results and charcoal as going to the box, with no cap", () => {
    const plan = planOutputContainer(OUTPUT_CONTAINERS.furnace, [
      wood(),
      metalOre(),
      fragments(),
      charcoal(),
    ]);

    for (const row of plan.slice(2)) {
      expect(row).toMatchObject({
        max: 0,
        goesToBox: true,
        notAccepted: false,
        stopsOven: false,
        rowCapacity: null,
      });
    }
  });

  it("gives a furnace's third ore row one stack and the shares-slots flag", () => {
    const plan = planOutputContainer(OUTPUT_CONTAINERS.furnace, [
      metalOre(),
      sulfurOre(),
      hqOre(),
    ]);

    expect(plan[2]).toMatchObject({ max: 100, sharesSlots: true });
  });

  it("lowers a large furnace's wood to what its fuel slots hold and splits the ore", () => {
    const plan = planOutputContainer(OUTPUT_CONTAINERS["furnace.large"], [
      wood(3000),
      metalOre(),
      sulfurOre(),
      hqOre(),
    ]);

    expect(plan[0]).toMatchObject({
      max: 2000,
      rowCapacity: 2000,
      aboveCapacity: true,
    });
    expect(plan.slice(1).map((row) => row.max)).toEqual([2000, 2000, 100]);
  });

  it("takes wood as fuel and crude oil as input in a small oil refinery", () => {
    const plan = planOutputContainer(OUTPUT_CONTAINERS["small.oil.refinery"], [
      wood(),
      item("crude.oil", 500),
      item("lowgradefuel", 500),
    ]);

    expect(plan.map((row) => row.max)).toEqual([1000, 500, 0]);
    expect(plan[2]).toMatchObject({ goesToBox: true });
  });

  it("flags wood as not accepted by the electric furnace, which has no fuel slot", () => {
    const plan = planOutputContainer(OUTPUT_CONTAINERS["electric.furnace"], [
      wood(500),
      metalOre(),
    ]);

    expect(plan[0]).toMatchObject({ max: 500, notAccepted: true });
    expect(plan[1]).toMatchObject({ max: 2000, slotGroup: "input" });
  });

  it("warns when a result row on a fuel oven has a Max above 0", () => {
    const plan = planOutputContainer(OUTPUT_CONTAINERS.furnace, [
      fragments(5000),
      charcoal(),
    ]);

    expect(plan[0]).toMatchObject({
      max: 5000,
      goesToBox: true,
      stopsOven: true,
    });
    expect(plan[1]).toMatchObject({ stopsOven: false });
  });

  it("doesn't warn about a result row on the electric furnace, which pauses instead", () => {
    const [plan] = planOutputContainer(OUTPUT_CONTAINERS["electric.furnace"], [
      fragments(5000),
    ]);

    expect(plan).toMatchObject({ goesToBox: true, stopsOven: false });
  });

  it("never lets fuel rows and input rows share slots", () => {
    const plan = planOutputContainer(OUTPUT_CONTAINERS["furnace.large"], [
      metalOre(),
      wood(),
      charcoal(),
    ]);

    expect(plan.map((row) => row.max)).toEqual([5000, 2000, 0]);
  });
});
