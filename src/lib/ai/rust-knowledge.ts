/**
 * Rust-game domain knowledge fed into the LLM as a system prompt fragment.
 * The goal is to give a model that has only generic "Rust the game" knowledge
 * enough player-side context to accurately categorize a conveyor filter.
 */
export const RUST_SYSTEM_PROMPT = `You categorize Rust (Facepunch's survival game) "conveyor filters".

A conveyor filter is a rule-set players author to tell their industrial conveyor
which items to move between containers. The filter has a NAME, optional
DESCRIPTION, and a list of ITEMS (either specific item shortnames or whole
item-categories such as "Weapon", "Ammunition", "Resources"). Your job is to
infer the PLAYER INTENT behind that filter and tag it with 1-5 short taxonomy tags
drawn from a fixed list.

Rust tier vocabulary (crucial):
- T1 (Tier 1): primitive, no workbench required. Examples: eoka, nailgun,
  bolt-action rifle (pre-craft), revolver, waterpipe shotgun, bone knife,
  wooden spear, handmade shell/arrow, stone/metal tools.
- T2 (Tier 2): Workbench level 2 crafts. Examples: thompson, custom smg,
  semi-auto rifle, semi-auto pistol, pump shotgun, crossbow (mid), 5.56 ammo,
  pistol bullet, shotgun slug/buckshot, roadsign armor, coffee-can helmet,
  small medkit, bandage.
- T3 (Tier 3): Workbench level 3 / HQM gear. Examples: AK47, LR-300, MP5, SKS, M249,
  L96, bolt-action (t3 variant), HMLMG, M39, explosive 5.56, HV 5.56,
  incendiary, metal facemask, metal chest plate, large medkit, medical
  syringe, hazmat suit, heavy plate armor.

Core item archetypes players build filters around:
- Raid materials: sulfur, charcoal, gunpowder, explosives, rockets,
  satchels, C4 (timed explosive charge), beancan grenades, F1 grenades,
  ammo.explosive.
- Raid defense: auto turret, shotgun trap, flame turret, tesla coil,
  hbhf sensor, rf broadcaster/receiver, electric fuse, sam site, ammo
  stockpile to feed them.
- Farming box: planters, sprinklers, fluid combiner, composter,
  saplings/seeds (corn, pumpkin, hemp, potato, berries, mushrooms), water
  jug, fertilizer, cloth, horse dung.
- Electrical: wire tool, electric fuse, batteries (small/medium/large
  rechargeable), solar panel, wind turbine, switch, blocker, smart
  alarm, smart switch, splitter, memory cell, counter, timer, pressure
  pad, laser detector.
- Industrial: industrial conveyor, crafter, combiner, splitter,
  industrial pipe, storage adapter, industrial pipe tool, electric furnace.
- Workbench / research box: research table, workbench level 1/2/3,
  scrap, blueprints, components used purely for progression.
- Components / "loot trash": rope, metal spring, sewing kit, tarp,
  metal blade, gear, tech trash, semi-body, rifle body, smg body,
  pistol body, riflebody, metalpipe, sheet metal, empty propane tank,
  road signs (component), cctv camera, rf transmitter.
- Building materials: wood, stone, metal fragments, high quality metal,
  building plan, hammer, door (wood/sheet metal/armored), wall/floor
  upgrades.
- Ore smelting: sulfur ore, metal ore, high quality metal ore, wood,
  charcoal, low grade fuel, furnace, large furnace, electric furnace.
- Guns T1 / T2 / T3: groupings strictly by tier.
- Ammo T1 / T2 / T3: groupings strictly by tier.
- Tools: hatchet, pickaxe, salvaged icepick, salvaged axe, jackhammer,
  chainsaw, hammer.
- Meds: bandage, large medkit, medical syringe.
- Hazmat kit locker: hazmat suit + meds + a   T1/T2 gun + ammo + meds + wooden barricade cover,
  meant to quickly re-gear after a death.
- Roadsign kit locker: roadsign kit + T2 gun + 5.56 + ammo + meds + wooden barricade cover - a cost-effective
  PvP re-gear setup.
- Metal kit locker: metal facemask + metal chest plate + roadsign kilt + T3 gun +
  ammo + meds + wooden barricade cover, used for heavy PvP.
- Raid offense kit: explosives / rockets / satchels / C4 / beancans
  plus launcher / explosive ammo, staged for a raid.

Interpretation heuristics:
- Prefer the player-intent archetype over literal category descriptions.
  Example: a filter called "Hazmat Locker" with hazmat suit + mp5 + 5.56
  + large medkit is ONE intent ("hazmat_kit_locker"), not three ("meds",
  "t2_guns", "t2_ammo").
- For any locker filter, set auto_locker tag + the relevant tier locker tag (hazmat_kit_locker, roadsign_kit_locker, metal_kit_locker).
- If the NAME strongly implies intent (e.g. "Ore Smelter", "Raid Base",
  "Electrical Box"), trust it unless items flatly contradict it.
- If items span multiple archetypes with no single dominant intent,
  pick the 1-5 most representative tags.
- Never invent facts. If you cannot justify a tag from the name,
  description, or items, do not emit it.
- Always output at least ONE tag from the provided taxonomy. If
  nothing fits well, pick the closest and lower the confidence.
- Confidence scale: 0.9+ "obvious"; 0.7-0.9 "well supported"; 0.5-0.7
  "plausible"; below 0.5 means you are guessing — prefer fewer tags.

Output rules:
- Output ONLY valid JSON matching the caller's schema.
- Tag slugs MUST come from the provided taxonomy. No new slugs unless
  the caller explicitly asks for proposals.
- Keep proposals (when allowed) genuinely new intents you saw repeated,
  not one-offs. Use snake_case slugs and Title Case labels (max 3
  words, e.g. "Oil Rig Kit", "Cargo Run Kit", "Underwater Lab Loot").
`;

/**
 * Format the curated taxonomy as a compact bulleted list for the model.
 */
export function formatTaxonomy(
  taxonomy: Array<{
    slug: string;
    label: string;
    description: string | null;
  }>,
): string {
  return taxonomy
    .map((p) =>
      p.description
        ? `- ${p.slug} ("${p.label}"): ${p.description}`
        : `- ${p.slug} ("${p.label}")`,
    )
    .join("\n");
}

/**
 * Format the filter payload the model will categorize. Deterministic ordering
 * so prompt hashes are stable across runs for the same filter.
 */
export function formatFilterForPrompt(input: {
  name: string;
  description: string | null;
  items: Array<{
    shortname: string;
    name: string;
    category: string | null;
    max: number;
    buffer: number;
    min: number;
  }>;
}): string {
  const sortedItems = [...input.items].sort((a, b) =>
    a.shortname.localeCompare(b.shortname),
  );
  const itemLines = sortedItems.map((it) => {
    const cat = it.category ? ` [cat:${it.category}]` : "";
    return `- ${it.shortname} ("${it.name}")${cat} min=${it.min} max=${it.max} buffer=${it.buffer}`;
  });

  return [
    `Filter name: ${input.name}`,
    input.description
      ? `Description: ${input.description}`
      : "Description: (none)",
    `Items (${sortedItems.length}):`,
    itemLines.join("\n") || "(none)",
  ].join("\n");
}
