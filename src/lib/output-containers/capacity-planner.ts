import type {
  AcceptRule,
  OutputContainer,
  SlotGroup,
} from "@/lib/output-containers/container-table";
import type { ItemType } from "@/db/schema";

export interface PlannerItem {
  shortname: string;
  stackSize: number;
  itemType: ItemType;
  category: string;
}

export type PlannerRow =
  | ({ kind: "item"; max: number } & PlannerItem)
  | {
      kind: "category";
      category: string;
      /** Insertable items only. */
      items: readonly PlannerItem[];
      max: number;
    };

export interface RowPlan {
  max: number;
  slotGroup: string | null;
  /** A category row assumes its category's most common stack size. */
  stackSize: number | null;
  splitShare: number | null;
  rowCapacity: number | null;
  notAccepted: boolean;
  goesToBox: boolean;
  stopsOven: boolean;
  sharesSlots: boolean;
  aboveShare: boolean;
  aboveCapacity: boolean;
}

function ruleAccepts(rule: AcceptRule, item: PlannerItem) {
  switch (rule.kind) {
    case "any":
      return true;
    case "items":
      return rule.shortnames.includes(item.shortname);
    case "category":
      if (rule.alsoItems?.includes(item.shortname)) return true;
      return (
        item.category === rule.category &&
        !rule.except?.includes(item.shortname)
      );
    case "notCategory":
      return item.category !== rule.category;
  }
}

export function acceptingGroup(
  container: OutputContainer,
  item: PlannerItem,
): SlotGroup | null {
  // Water can't go in any of these containers.
  if (item.itemType === "Liquid") return null;
  if (container.blockedItems?.includes(item.shortname)) return null;
  return (
    container.slotGroups.find((group) => ruleAccepts(group.accepts, item)) ??
    null
  );
}

// On a tie, assume the bigger stack so the row doesn't stop early.
function mostCommonStackSize(items: readonly PlannerItem[]) {
  const counts = new Map<number, number>();
  for (const item of items) {
    if (item.itemType === "Liquid") continue;
    counts.set(item.stackSize, (counts.get(item.stackSize) ?? 0) + 1);
  }
  let best: { size: number; count: number } | null = null;
  for (const [size, count] of counts) {
    if (
      !best ||
      count > best.count ||
      (count === best.count && size > best.size)
    ) {
      best = { size, count };
    }
  }
  return best?.size ?? null;
}

function categoryGroup(
  container: OutputContainer,
  items: readonly PlannerItem[],
) {
  const counts = new Map<SlotGroup, number>();
  for (const item of items) {
    const group = acceptingGroup(container, item);
    if (group) counts.set(group, (counts.get(group) ?? 0) + 1);
  }
  let best: SlotGroup | null = null;
  for (const group of container.slotGroups) {
    if ((counts.get(group) ?? 0) > (best ? counts.get(best)! : 0)) {
      best = group;
    }
  }
  return best;
}

interface Placement {
  group: SlotGroup;
  stackSize: number;
}

function placementOf(
  container: OutputContainer,
  row: PlannerRow,
): Placement | null {
  if (row.kind === "item") {
    const group = acceptingGroup(container, row);
    return group && { group, stackSize: row.stackSize };
  }
  const group = categoryGroup(container, row.items);
  const stackSize = mostCommonStackSize(row.items);
  return group && stackSize ? { group, stackSize } : null;
}

function divide(slots: number, indexes: number[]) {
  const free = Math.max(0, slots);
  const base = Math.floor(free / indexes.length);
  const remainder = free % indexes.length;
  return new Map(
    indexes.map((index, position) => [
      index,
      base + (position < remainder ? 1 : 0),
    ]),
  );
}

function withLimits(max: number, splitShare: number, rowCapacity: number) {
  return {
    max: max > 0 ? Math.min(max, rowCapacity) : splitShare,
    splitShare,
    rowCapacity,
    aboveShare: max > splitShare,
    aboveCapacity: max > rowCapacity,
  };
}

export function planOutputContainer(
  container: OutputContainer,
  rows: PlannerRow[],
): RowPlan[] {
  const placements = rows.map((row) => placementOf(container, row));
  const capacityOf = (index: number) =>
    placements[index]!.group.slots * placements[index]!.stackSize;
  const cappedMax = (index: number) =>
    Math.min(rows[index].max, capacityOf(index));

  // Item rows of a category row's group count against its Max.
  const categoryOf = new Map<number, number>();
  rows.forEach((row, category) => {
    if (row.kind !== "category" || !placements[category]) return;
    rows.forEach((other, index) => {
      if (
        other.kind === "item" &&
        other.category === row.category &&
        placements[index]?.group === placements[category]!.group
      ) {
        categoryOf.set(index, category);
      }
    });
  });
  const membersOf = (category: number) =>
    [...categoryOf].flatMap(([index, of]) => (of === category ? [index] : []));

  /** asUncapped splits as if that row's Max were 0. */
  function split(group: SlotGroup, asUncapped?: number) {
    const isCapped = (index: number) =>
      index !== asUncapped && rows[index].max > 0;
    const inGroup = rows.flatMap((_, index) =>
      placements[index]?.group === group ? [index] : [],
    );
    const slotsUsed = (index: number) => {
      const cappedMembers = membersOf(index)
        .filter(isCapped)
        .reduce((sum, member) => sum + cappedMax(member), 0);
      const own = Math.max(0, cappedMax(index) - cappedMembers);
      return Math.ceil(own / placements[index]!.stackSize);
    };
    // Uncapped members of a capped category share the category's slots.
    const isNested = (index: number) => {
      const category = categoryOf.get(index);
      return category !== undefined && isCapped(category);
    };

    const used = inGroup
      .filter(isCapped)
      .reduce((sum, index) => sum + slotsUsed(index), 0);
    const shares = divide(
      group.slots - used,
      inGroup.filter((index) => !isCapped(index) && !isNested(index)),
    );
    for (const category of inGroup.filter(isCapped)) {
      const nested = membersOf(category).filter((index) => !isCapped(index));
      if (nested.length === 0) continue;
      const inside = divide(
        slotsUsed(category),
        [...nested, category].sort((a, b) => a - b),
      );
      for (const index of nested) shares.set(index, inside.get(index)!);
    }
    return shares;
  }

  const shareSlots = new Map<number, number>();
  for (const group of container.slotGroups) {
    const shares = split(group);
    rows.forEach((_, index) => {
      if (placements[index]?.group !== group) return;
      shareSlots.set(
        index,
        shares.get(index) ?? split(group, index).get(index)!,
      );
    });
  }

  const plans: RowPlan[] = rows.map((row, index) => {
    const placement = placements[index];
    if (!placement) {
      const goesToBox =
        row.kind === "item" && !!container.results?.includes(row.shortname);
      return {
        max: row.max,
        slotGroup: null,
        stackSize: null,
        splitShare: null,
        rowCapacity: null,
        notAccepted: !goesToBox,
        goesToBox,
        stopsOven: goesToBox && !!container.fuelOven && row.max > 0,
        sharesSlots: false,
        aboveShare: false,
        aboveCapacity: false,
      };
    }

    const slots = shareSlots.get(index)!;
    return {
      // A 0 Max means no limit, so a row squeezed out still gets one stack.
      ...withLimits(
        row.max,
        Math.max(slots, 1) * placement.stackSize,
        capacityOf(index),
      ),
      slotGroup: placement.group.id,
      stackSize: placement.stackSize,
      notAccepted: false,
      goesToBox: false,
      stopsOven: false,
      sharesSlots: row.max === 0 && slots === 0,
    };
  });

  // Members may stack higher, so their Max is added, not slots.
  rows.forEach((row, index) => {
    const placement = placements[index];
    if (row.kind !== "category" || !placement) return;
    const { group, stackSize } = placement;
    const members = membersOf(index);
    const memberSlots = members.reduce(
      (sum, member) =>
        sum + Math.ceil(plans[member].max / plans[member].stackSize!),
      0,
    );
    const rowCapacity =
      Math.max(0, group.slots - memberSlots) * stackSize +
      members.reduce((sum, member) => sum + plans[member].max, 0);

    const atZero = split(group, index);
    const membersAtZero = members.reduce(
      (sum, member) =>
        sum +
        (rows[member].max > 0
          ? cappedMax(member)
          : Math.max(atZero.get(member)!, 1) * plans[member].stackSize!),
      0,
    );
    const splitShare = Math.min(
      Math.max(atZero.get(index)!, 1) * stackSize + membersAtZero,
      rowCapacity,
    );
    plans[index] = {
      ...plans[index],
      ...withLimits(row.max, splitShare, rowCapacity),
    };
  });

  return plans;
}
