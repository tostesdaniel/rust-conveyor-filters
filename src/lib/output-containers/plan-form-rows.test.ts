import { describe, expect, it } from "vitest";

import { OUTPUT_CONTAINERS } from "@/lib/output-containers/container-table";
import {
  seedWritten,
  splitFormRows,
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
