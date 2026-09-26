// Last checked against this game build.
export const CONTAINER_TABLE_GAME_BUILD = "4222685261503300823";

export type AcceptRule = { kind: "any" };

export interface SlotGroup {
  id: string;
  slots: number;
  accepts: AcceptRule;
}

export interface OutputContainer {
  capacityGroup: string;
  slotGroups: readonly SlotGroup[];
  blockedItems?: readonly string[];
}

function plainBox(slots: number): OutputContainer {
  return {
    capacityGroup: `${slots} slots`,
    slotGroups: [{ id: "main", slots, accepts: { kind: "any" } }],
  };
}

export const OUTPUT_CONTAINERS = {
  "box.wooden.large": plainBox(48),
  storage_barrel_b: plainBox(48),
  storage_barrel_c: plainBox(48),
  "abyss.barrel.horizontal": plainBox(48),
  "abyss.barrel.vertical": plainBox(48),
  "bamboo.barrel": plainBox(48),
  "wicker.barrel": plainBox(48),
  "industrial.storage.horizontal": plainBox(48),
  "industrial.storage.vertical": plainBox(48),
  "krieg.storage.horizontal": plainBox(48),
  "krieg.storage.vertical": plainBox(48),
  "coffin.storage": plainBox(48),
  "vending.machine": plainBox(30),
  "box.wooden": plainBox(18),
  "electric.wallcabinet": plainBox(18),
} as const satisfies Record<string, OutputContainer>;

export type OutputContainerShortname = keyof typeof OUTPUT_CONTAINERS;

export const OUTPUT_CONTAINER_SHORTNAMES = Object.keys(OUTPUT_CONTAINERS) as [
  OutputContainerShortname,
  ...OutputContainerShortname[],
];

export function toOutputContainerShortname(
  shortname: string | null | undefined,
): OutputContainerShortname | null {
  return shortname && Object.hasOwn(OUTPUT_CONTAINERS, shortname)
    ? (shortname as OutputContainerShortname)
    : null;
}
