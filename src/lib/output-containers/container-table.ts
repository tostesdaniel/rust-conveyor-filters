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
  /** Smallest Max per Smelt item that lasts an oven through the slowest conveyor transfer (7.5s). */
  keepLitMax?: Readonly<Record<string, number>>;
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
  keepLitMax,
}: {
  fuelSlots: number;
  inputSlots: number;
  input: readonly string[];
  results: readonly string[];
  keepLitMax: Readonly<Record<string, number>>;
}): OutputContainer {
  const inputGroup: SlotGroup = {
    id: "input",
    slots: inputSlots,
    accepts: { kind: "items", shortnames: input },
  };
  if (fuelSlots === 0) {
    return {
      capacityGroup: "Ovens",
      slotGroups: [inputGroup],
      results,
      keepLitMax,
    };
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
    keepLitMax,
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
  furnace: oven({
    fuelSlots: 1,
    inputSlots: 2,
    input: SMELT_INPUT,
    results: SMELT_RESULTS,
    keepLitMax: { wood: 5, "metal.ore": 4, "sulfur.ore": 6, "hq.metal.ore": 3 },
  }),
  "furnace.large": oven({
    fuelSlots: 2,
    inputSlots: 5,
    input: SMELT_INPUT,
    results: SMELT_RESULTS,
    keepLitMax: {
      wood: 5,
      "metal.ore": 13,
      "sulfur.ore": 24,
      "hq.metal.ore": 7,
    },
  }),
  "small.oil.refinery": oven({
    fuelSlots: 1,
    inputSlots: 1,
    input: REFINE_INPUT,
    results: REFINE_RESULTS,
    keepLitMax: { wood: 7, "crude.oil": 4 },
  }),
  "electric.furnace": oven({
    fuelSlots: 0,
    inputSlots: 2,
    input: SMELT_INPUT,
    results: SMELT_RESULTS,
    keepLitMax: { "metal.ore": 5, "sulfur.ore": 9, "hq.metal.ore": 3 },
  }),
} as const satisfies Record<string, OutputContainer>;

export type OutputContainerShortname = keyof typeof OUTPUT_CONTAINERS;

export const OUTPUT_CONTAINER_SHORTNAMES = Object.keys(OUTPUT_CONTAINERS) as [
  OutputContainerShortname,
  ...OutputContainerShortname[],
];

export function isOutputContainer(
  shortname: string,
): shortname is OutputContainerShortname {
  return Object.hasOwn(OUTPUT_CONTAINERS, shortname);
}

export function toOutputContainerShortname(
  shortname: string | null | undefined,
): OutputContainerShortname | null {
  return shortname && isOutputContainer(shortname) ? shortname : null;
}

function namesInRule(rule: AcceptRule) {
  switch (rule.kind) {
    case "any":
      return { shortnames: [], categories: [] };
    case "items":
      return { shortnames: rule.shortnames, categories: [] };
    case "category":
      return {
        shortnames: [...(rule.except ?? []), ...(rule.alsoItems ?? [])],
        categories: [rule.category],
      };
    case "notCategory":
      return { shortnames: [], categories: [rule.category] };
  }
}

export function containersNaming() {
  const byShortname = new Map<string, Set<OutputContainerShortname>>();
  const byCategory = new Map<string, Set<OutputContainerShortname>>();
  const add = (
    index: Map<string, Set<OutputContainerShortname>>,
    key: string,
    container: OutputContainerShortname,
  ) => index.set(key, (index.get(key) ?? new Set()).add(container));

  for (const container of OUTPUT_CONTAINER_SHORTNAMES) {
    const entry: OutputContainer = OUTPUT_CONTAINERS[container];
    const shortnames = [
      ...(entry.blockedItems ?? []),
      ...(entry.results ?? []),
    ];
    for (const group of entry.slotGroups) {
      const names = namesInRule(group.accepts);
      shortnames.push(...names.shortnames);
      for (const category of names.categories) {
        add(byCategory, category, container);
      }
    }
    for (const shortname of shortnames) add(byShortname, shortname, container);
  }
  return { byShortname, byCategory };
}
