export interface SeedTag {
  slug: string;
  label: string;
  description: string;
}

export const SEED_TAGS: SeedTag[] = [
  {
    slug: "auto_locker",
    label: "Auto Locker",
    description: "Generalistic tag for pvp kit lockers.",
  },
  {
    slug: "hazmat_kit_locker",
    label: "Hazmat Kit",
    description:
      "Gear up locker for monument / cargo runs: hazmat suit, meds, T2/T3 gun + ammo, wooden barricade cover.",
  },
  {
    slug: "roadsign_kit_locker",
    label: "Roadsign Kit",
    description:
      "Cheap PvP re-gear: roadsign armor set, T2 gun + 5.56, meds, wooden barricade cover.",
  },
  {
    slug: "metal_kit_locker",
    label: "Metal Kit",
    description:
      "Heavy PvP re-gear: metal chest + facemask, T3 gun, ammo, meds, wooden barricade cover.",
  },
  { slug: "pvp", label: "PvP", description: "PvP gearsets or related items." },
  {
    slug: "raid_offense_kit",
    label: "Raid Offense",
    description:
      "Staging for a raid: explosives, rockets, satchels, C4, launcher / explosive ammo, molotovs, F1 grenades, propane explosive bomb, 40mm grenades.",
  },
  {
    slug: "raid_defense_kit",
    label: "Raid Defense",
    description:
      "Materials for defending a raid, including building materials: wood, stone, metal fragments, high quality metal, building plan, hammer, F1 grenades, smoke grenades, and optionally gearsets (gun + ammo, meds, clothing and armor).",
  },
  {
    slug: "farming_box",
    label: "Farming",
    description:
      "Planters, seeds, water, fertilizer, sprinklers, composter, berries, hemp.",
  },
  {
    slug: "electrical_box",
    label: "Electrical",
    description:
      "Wire tool, pipe tool, batteries, solar panels, switches, memory cells, logical components,smart components.",
  },
  {
    slug: "industrial_box",
    label: "Industrial",
    description:
      "Industrial conveyors, crafters, combiners, splitters, pipe tool, storage adapters.",
  },
  {
    slug: "components_box",
    label: "Components",
    description:
      "Components: blueprint fragments, electric fuse, empty propane tank, gears, metal blade, metal pipe, metal spring, rifle body, road signs, rope, smg body, semi automatic body, sewing kit, sheet metal, tarp, tech trash, targeting computer, cctv camera.",
  },
  {
    slug: "construction_box",
    label: "Construction",
    description:
      "Wood, stone, metal frags, HQM, doors, ladder hatches, fences, barricades, external walls, tool cupboard, ladders, embrazures, window glass / bars, hammer, building plan, upgrades.",
  },
  {
    slug: "resources",
    label: "Resources",
    description:
      "Resources: wood, stone, metal frags, HQM, low grade fuel, crude oil, ore, charcoal, diesel, leather, animal fat, leather.",
  },
  {
    slug: "ore_smelting_box",
    label: "Ore Smelting",
    description:
      "Sulfur/metal/HQM ore, wood, charcoal, crude oil, routed through furnaces.",
  },
  {
    slug: "meds_box",
    label: "Meds",
    description: "Bandages, large medkits, syringes.",
  },
  {
    slug: "tools_box",
    label: "Tools",
    description:
      "Hatchets, pickaxes, salvaged tools, jackhammer, chainsaw, fishing rod, hammer.",
  },
  {
    slug: "guns_t1",
    label: "T1 Guns",
    description:
      "No workbench or workbench level 1 firearms: eoka, bows, crossbows, nailgun, waterpipe, double barrel shotgun, revolver, handmade smg",
  },
  {
    slug: "guns_t2",
    label: "T2 Guns",
    description:
      "Workbench 2 firearms: thompson, custom smg, semi-auto rifle/pistol, python, M92 pistol, prototype 17, pump shotgun.",
  },
  {
    slug: "guns_t3",
    label: "T3 Guns",
    description:
      "Workbench 3 firearms: AK, LR-300, MP5, M249, L96, HMLMG, M39, SKS.",
  },
  {
    slug: "ammo_t1",
    label: "T1 Ammo",
    description:
      "Primitive ammo: handmade shell, wooden / fire / bone / high velocity arrow, pistol bullet, nailgun nails, darts, speargun spear",
  },
  {
    slug: "ammo_t2",
    label: "T2 Ammo",
    description:
      "5.56 rifle ammo, shotgun slug / buckshot / incendiary shell, high velocity / incendiary rocket, homing missile, torpedo, SAM ammo, firebomb, scattershot,cannonball, hammerhead / incendiary / piercer / pitchfork bolt",
  },
  {
    slug: "ammo_t3",
    label: "T3 Ammo",
    description:
      "Explosive 5.56, HV 5.56, incendiary 5.56, 40mm HE grenade, 40mm shotgun round, 40mm smoke grenade, rocket.",
  },
  {
    slug: "food_box",
    label: "Food",
    description:
      "Cooked food, raw meat, mushroom, water, pumpkin, corn, potato, pies, bread, fish, pickles, granola bar, canned food, apple.",
  },
  {
    slug: "clothing_box",
    label: "Clothing",
    description:
      "Non-combat clothing and light armor: shirts, pants, hats, boots, hoodies.",
  },
  {
    slug: "armor_box",
    label: "Armor",
    description:
      "Combat armor pieces: roadsign, metal facemask / chest, coffee can, bone.",
  },
  {
    slug: "vehicle_parts",
    label: "Vehicles",
    description: "Modular car parts, boat parts.",
  },
  {
    slug: "deployables_box",
    label: "Deployables",
    description:
      "Furniture and utility deployables: bed, sleeping bag, tool cupboard, sign, locker, boxes, shopfronts, lock, code lock, floor grills, wall dividers.",
  },
  {
    slug: "misc",
    label: "Misc",
    description:
      "Other items that don't fit into other categories or low-value/priority items.",
  },
  {
    slug: "catch_all",
    label: "Catch All",
    description: "Targets every or almost every item.",
  },
];
