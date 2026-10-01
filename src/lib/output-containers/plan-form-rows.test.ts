import { describe, expect, it } from "vitest";

import { OUTPUT_CONTAINERS } from "@/lib/output-containers/container-table";
import {
  fitAddedRow,
  perfectSmeltingOfForm,
  seedWritten,
  splitFormRows,
  switchPerfectSmelting,
  type CatalogueItem,
} from "@/lib/output-containers/plan-form-rows";

const largeBox = OUTPUT_CONTAINERS["box.wooden.large"];

const resource = (shortname: string): CatalogueItem => ({
  shortname,
  stackSize: 1000,
  itemType: "Generic",
  category: "Resources",
});

const catalogue = new Map([
  [1, resource("wood")],
  [2, resource("stones")],
]);

const wood = (max: number) => ({ itemId: 1, max });
const stones = (max: number) => ({ itemId: 2, max });

describe("seedWritten then splitFormRows after the edit form reloads", () => {
  it("gives the remaining row all 48 slots once a saved split row is deleted", () => {
    const saved = [wood(24000), stones(24000)];
    const written = seedWritten(largeBox, saved, catalogue);

    const split = splitFormRows(largeBox, [wood(24000)], catalogue, written);

    expect(split.maxes).toEqual([48000]);
  });

  it("keeps a row the author changed before saving", () => {
    const saved = [wood(5000), stones(24000)];
    const written = seedWritten(largeBox, saved, catalogue);

    const split = splitFormRows(largeBox, saved, catalogue, written);

    expect(split.maxes).toEqual([5000, 43000]);
  });
});

describe("Perfect smelting on form rows", () => {
  const furnace = OUTPUT_CONTAINERS.furnace;
  const smeltCatalogue = new Map<number, CatalogueItem>([
    [1, resource("wood")],
    [2, resource("sulfur.ore")],
    [3, resource("metal.ore")],
    [4, resource("metal.fragments")],
    [5, { ...resource("can.beans.empty"), stackSize: 10 }],
  ]);
  const row = (itemId: number) => (max: number) => ({ itemId, max });
  const smeltWood = row(1);
  const sulfurOre = row(2);
  const metalOre = row(3);
  const fragments = row(4);
  const cans = row(5);
  const smeltKeys = ["item:1", "item:2", "item:3"];
  const keysOf = (written: ReadonlyMap<string, number>) => [...written.keys()];

  it("reads the check from form rows", () => {
    expect(
      perfectSmeltingOfForm(
        furnace,
        [smeltWood(5), sulfurOre(6)],
        smeltCatalogue,
      ),
    ).toBe("on");
    expect(
      perfectSmeltingOfForm(
        furnace,
        [smeltWood(6), sulfurOre(6)],
        smeltCatalogue,
      ),
    ).toBe("off");
    expect(perfectSmeltingOfForm(furnace, [fragments(0)], smeltCatalogue)).toBe(
      "noSmeltRows",
    );
  });

  it("splits with Keep-lit Max and keeps Smelt rows out of written", () => {
    const split = splitFormRows(
      furnace,
      [smeltWood(0), sulfurOre(0), fragments(0), cans(0)],
      smeltCatalogue,
      new Map(),
      { perfectSmelting: true },
    );

    expect(split.maxes).toEqual([5, 6, 0, 10]);
    expect(keysOf(split.written)).not.toContain("item:1");
    expect(keysOf(split.written)).not.toContain("item:2");
    expect(split.written.get("item:5")).toBe(10);
  });

  it("applies the new oven's values on a change between ovens", () => {
    const split = splitFormRows(
      OUTPUT_CONTAINERS["furnace.large"],
      [smeltWood(5), metalOre(4)],
      smeltCatalogue,
      new Map(),
      { perfectSmelting: true },
    );

    expect(split.maxes).toEqual([5, 13]);
  });

  it("turning the switch on writes Keep-lit Max into every Smelt row", () => {
    const rows = [smeltWood(1000), sulfurOre(1000), metalOre(1000), cans(7)];
    const written = splitFormRows(
      furnace,
      rows,
      smeltCatalogue,
      new Map(),
    ).written;

    const switched = switchPerfectSmelting(
      furnace,
      rows,
      smeltCatalogue,
      written,
      true,
    );

    expect(switched.maxes).toEqual([5, 6, 4, 7]);
    expect(
      keysOf(switched.written).filter((key) => smeltKeys.includes(key)),
    ).toEqual([]);
  });

  it("turning the switch off re-splits Smelt rows the author edited", () => {
    const switched = switchPerfectSmelting(
      furnace,
      [smeltWood(3), sulfurOre(6), cans(10)],
      smeltCatalogue,
      new Map(),
      false,
    );

    expect(switched.maxes).toEqual([1000, 1000, 10]);
    expect(switched.written.get("item:1")).toBe(1000);
    expect(switched.written.get("item:2")).toBe(1000);
  });

  describe("in a large furnace split around cans", () => {
    const largeFurnace = OUTPUT_CONTAINERS["furnace.large"];
    const offRows = [metalOre(3000), cans(20)];
    const offWritten = splitFormRows(
      largeFurnace,
      [metalOre(0), cans(0)],
      smeltCatalogue,
      new Map(),
    ).written;

    it("turning the switch on gives split rows the slots Smelt rows leave", () => {
      const switched = switchPerfectSmelting(
        largeFurnace,
        offRows,
        smeltCatalogue,
        offWritten,
        true,
      );

      expect(switched.maxes).toEqual([13, 40]);
    });

    it("turning it back off gives what Re-split would", () => {
      const on = switchPerfectSmelting(
        largeFurnace,
        offRows,
        smeltCatalogue,
        offWritten,
        true,
      );
      const off = switchPerfectSmelting(
        largeFurnace,
        [metalOre(13), cans(40)],
        smeltCatalogue,
        on.written,
        false,
      );

      expect(off.maxes).toEqual([3000, 20]);
    });

    it("seeds a saved Perfect smelting filter so Re-split keeps both rows", () => {
      const saved = [metalOre(13), cans(40)];
      const written = seedWritten(largeFurnace, saved, smeltCatalogue);

      expect(keysOf(written)).toEqual(["item:5"]);
      expect(
        splitFormRows(largeFurnace, saved, smeltCatalogue, written).maxes,
      ).toEqual([13, 40]);
    });
  });

  it("leaves switch-written values alone on Re-split", () => {
    const rows = [smeltWood(1000), sulfurOre(1000), cans(0)];
    const switched = switchPerfectSmelting(
      furnace,
      rows,
      smeltCatalogue,
      new Map(),
      true,
    );

    const split = splitFormRows(
      furnace,
      [smeltWood(5), sulfurOre(6), cans(0)],
      smeltCatalogue,
      switched.written,
    );

    expect(split.maxes).toEqual([5, 6, 10]);
  });

  it("gives an added Smelt row its Keep-lit Max while the switch is on", () => {
    const fit = fitAddedRow(
      furnace,
      [],
      smeltWood(0),
      smeltCatalogue,
      new Map(),
      {
        perfectSmelting: true,
      },
    );

    expect(fit.max).toBe(5);
    expect(keysOf(fit.written)).toEqual([]);
  });

  it("fits an added row that isn't a Smelt row as usual", () => {
    const fit = fitAddedRow(
      furnace,
      [smeltWood(5), sulfurOre(6)],
      cans(0),
      smeltCatalogue,
      new Map(),
      { perfectSmelting: true },
    );

    expect(fit.max).toBe(10);
  });
});
