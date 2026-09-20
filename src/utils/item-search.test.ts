import { describe, expect, it } from "vitest";

import { searchItems, tokenizeQuery } from "./item-search";

const ak = {
  name: "Assault Rifle",
  shortname: "rifle.ak",
  description: "High damage machine rifle.",
};
const explosiveAmmo = {
  name: "Explosive 5.56 Rifle Ammo",
  shortname: "ammo.rifle.explosive",
  description: "Explosive rounds for rifles.",
};
const sulfur = {
  name: "Sulfur",
  shortname: "sulfur",
  description: "Sulfur is commonly used in gunpowder, medicine, and matches.",
};
const gunpowder = {
  name: "Gun Powder",
  shortname: "gunpowder",
  description: "Used to craft ammunition and explosives.",
};

const names = (items: (typeof ak)[], query: string) =>
  searchItems(items, query).map((r) => r.item.name);

describe("tokenizeQuery", () => {
  it("drops surrounding and repeated whitespace", () => {
    expect(tokenizeQuery("  explosive   ammo ")).toEqual(["explosive", "ammo"]);
    expect(tokenizeQuery("   ")).toEqual([]);
  });
});

describe("searchItems", () => {
  const catalogue = [ak, explosiveAmmo, sulfur, gunpowder];

  it("finds items by the game's description", () => {
    expect(names(catalogue, "gunpowder")).toContain("Sulfur");
  });

  it("ranks a name or shortname hit above a description hit", () => {
    const results = names(catalogue, "gunpowder");
    expect(results[0]).toBe("Gun Powder");
    expect(results.indexOf("Sulfur")).toBeGreaterThan(0);
  });

  it("needs every term to land somewhere", () => {
    expect(names(catalogue, "explosive ammo")).toEqual([
      "Explosive 5.56 Rifle Ammo",
    ]);
    expect(names(catalogue, "explosive banana")).toEqual([]);
  });

  it("matches a term across fields, not within one", () => {
    // "assault" is only in the name, "machine" only in the description.
    expect(names(catalogue, "assault machine")).toEqual(["Assault Rifle"]);
  });

  it("flags the rows only the description explains", () => {
    const byName = new Map(
      searchItems(catalogue, "gunpowder").map((r) => [
        r.item.name,
        r.viaDescription,
      ]),
    );
    expect(byName.get("Sulfur")).toBe(true);
    expect(byName.get("Gun Powder")).toBe(false);
  });

  it("holds every field to a real substring", () => {
    // s-i-n-g turn up in order in Sulfur's description, which is all
    // match-sorter's default floor asks for. It put 166 of 1006 behind "ak".
    expect(names([sulfur], "sing")).toEqual([]);
  });

  it("returns everything, unflagged, on an empty query", () => {
    const results = searchItems(catalogue, "   ");
    expect(results).toHaveLength(4);
    expect(results.every((r) => !r.viaDescription)).toBe(true);
  });
});
