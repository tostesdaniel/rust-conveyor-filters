// Last checked against this game build.
export const CONTAINER_TABLE_GAME_BUILD = "4222685261503300823";

export type AcceptRule =
  | { kind: "any" }
  | { kind: "items"; shortnames: readonly string[] };

export interface SlotGroup {
  id: string;
  slots: number;
  accepts: AcceptRule;
}

export interface OutputContainer {
  capacityGroup: string;
  slotGroups: readonly SlotGroup[];
  blockedItems?: readonly string[];
  results?: readonly string[];
  /** A fuel oven with no room for its result switches off. */
  fuelOven?: boolean;
}

function plainBox(slots: number): OutputContainer {
  return {
    capacityGroup: `${slots} slots`,
    slotGroups: [{ id: "main", slots, accepts: { kind: "any" } }],
  };
}

const SMELT_INPUT = [
  "metal.ore",
  "sulfur.ore",
  "hq.metal.ore",
  "can.beans.empty",
  "can.tuna.empty",
  "honeycomb",
  "wolfmeat.cooked",
  "humanmeat.cooked",
];
const SMELT_RESULTS = [
  "metal.fragments",
  "sulfur",
  "metal.refined",
  "honey",
  "wolfmeat.burned",
  "humanmeat.burned",
];
const REFINE_INPUT = [
  "crude.oil",
  "can.beans.empty",
  "can.tuna.empty",
  "wolfmeat.cooked",
  "humanmeat.cooked",
];
const REFINE_RESULTS = [
  "lowgradefuel",
  "metal.fragments",
  "wolfmeat.burned",
  "humanmeat.burned",
];

function oven({
  fuelSlots,
  inputSlots,
  input,
  results,
}: {
  fuelSlots: number;
  inputSlots: number;
  input: readonly string[];
  results: readonly string[];
}): OutputContainer {
  const inputGroup: SlotGroup = {
    id: "input",
    slots: inputSlots,
    accepts: { kind: "items", shortnames: input },
  };
  if (fuelSlots === 0) {
    return { capacityGroup: "Ovens", slotGroups: [inputGroup], results };
  }
  return {
    capacityGroup: "Ovens",
    slotGroups: [
      {
        id: "fuel",
        slots: fuelSlots,
        accepts: { kind: "items", shortnames: ["wood"] },
      },
      inputGroup,
    ],
    results: [...results, "charcoal"],
    fuelOven: true,
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
  // The skins share their base oven's prefab values and can't be picked in
  // the conveyor filter, so only the base items are listed.
  furnace: oven({
    fuelSlots: 1,
    inputSlots: 2,
    input: SMELT_INPUT,
    results: SMELT_RESULTS,
  }),
  "furnace.large": oven({
    fuelSlots: 2,
    inputSlots: 5,
    input: SMELT_INPUT,
    results: SMELT_RESULTS,
  }),
  "small.oil.refinery": oven({
    fuelSlots: 1,
    inputSlots: 1,
    input: REFINE_INPUT,
    results: REFINE_RESULTS,
  }),
  "electric.furnace": oven({
    fuelSlots: 0,
    inputSlots: 2,
    input: SMELT_INPUT,
    results: SMELT_RESULTS,
  }),
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
