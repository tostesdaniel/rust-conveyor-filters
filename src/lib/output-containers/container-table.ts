// Last checked against this game build.
export const CONTAINER_TABLE_GAME_BUILD = "4222685261503300823";

export type AcceptRule =
  | { kind: "any" }
  | { kind: "items"; shortnames: readonly string[] }
  | {
      kind: "category";
      category: string;
      except?: readonly string[];
      alsoItems?: readonly string[];
    }
  | { kind: "notCategory"; category: string };

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

function fridge(slots: number): OutputContainer {
  return {
    capacityGroup: "Fridges",
    slotGroups: [
      {
        id: "main",
        slots,
        accepts: { kind: "category", category: "Food", alsoItems: ["botabag"] },
      },
    ],
  };
}

// Shields and diving tanks fit the backpack slot too.
const BACKPACK_SLOT_ITEMS = [
  "smallbackpack",
  "largebackpack",
  "kriegbackpack",
  "parachute",
  "diving.tank",
  "diving.tank.double",
  "wooden.shield",
  "reinforced.wooden.shield",
  "metal.shield",
  "improvised.shield",
  "twitchrivalsflag",
  "minigunammopack",
];

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
  dropbox: plainBox(12),

  fridge: fridge(48),
  "mini fridge": fridge(18),
  locker: {
    capacityGroup: "Sorted slots",
    slotGroups: [
      {
        id: "clothing",
        slots: 7,
        accepts: {
          kind: "category",
          category: "Attire",
          except: BACKPACK_SLOT_ITEMS,
        },
      },
      {
        id: "backpack",
        slots: 1,
        accepts: { kind: "items", shortnames: BACKPACK_SLOT_ITEMS },
      },
      {
        id: "belt",
        slots: 6,
        accepts: { kind: "notCategory", category: "Attire" },
      },
    ],
  },
  "cupboard.tool": {
    capacityGroup: "Sorted slots",
    slotGroups: [
      {
        id: "resources",
        slots: 24,
        accepts: { kind: "category", category: "Resources" },
      },
      {
        id: "tools",
        slots: 5,
        accepts: {
          kind: "items",
          shortnames: [
            "hammer",
            "toolgun",
            "building.planner",
            "hosetool",
            "wiretool",
            "pipetool",
            "spraycan",
            "wallpaper.tool",
            "boat.planner",
          ],
        },
      },
    ],
    blockedItems: [
      "gunpowder",
      "sulfur",
      "sulfur.ore",
      "explosives",
      "diesel_barrel",
      "cctv.camera",
      "targeting.computer",
    ],
  },
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
