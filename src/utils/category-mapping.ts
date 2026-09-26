export const categoryMapping: Record<string, string> = {
  Weapon: "Weapons",
  Construction: "Construction",
  Items: "Items",
  Resources: "Resources",
  Attire: "Clothing",
  Tool: "Tools",
  Medical: "Medical",
  Food: "Food",
  Ammunition: "Ammo",
  Traps: "Traps",
  Misc: "Other",
  Component: "Components",
  Electrical: "Electrical",
  Fun: "Fun",
};

export function gameCategoryOf(displayName: string) {
  return Object.keys(categoryMapping).find(
    (key) => categoryMapping[key] === displayName,
  );
}
