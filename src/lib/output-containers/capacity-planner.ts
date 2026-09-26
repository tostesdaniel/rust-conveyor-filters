import type {
  OutputContainer,
  SlotGroup,
} from "@/lib/output-containers/container-table";
import type { ItemType } from "@/db/schema";

export type PlannerRow =
  | {
      kind: "item";
      shortname: string;
      stackSize: number;
      itemType: ItemType;
      max: number;
    }
  | { kind: "category"; max: number };

export interface RowPlan {
  max: number;
  slotGroup: string | null;
  splitShare: number | null;
  rowCapacity: number | null;
  notAccepted: boolean;
  sharesSlots: boolean;
  aboveShare: boolean;
  aboveCapacity: boolean;
}

type ItemRow = Extract<PlannerRow, { kind: "item" }>;

export function acceptingGroup(
  container: OutputContainer,
  row: ItemRow,
): SlotGroup | null {
  // Water can't go in any of these containers.
  if (row.itemType === "Liquid") return null;
  return (
    container.slotGroups.find((group) => group.accepts.kind === "any") ?? null
  );
}

function capacityOf(group: SlotGroup, row: ItemRow) {
  return group.slots * row.stackSize;
}

function slotsFor(group: SlotGroup, row: ItemRow) {
  return Math.ceil(Math.min(row.max, capacityOf(group, row)) / row.stackSize);
}

/**
 * Slots each uncapped row gets, keyed by row index. `asUncapped` splits as if
 * that row were at 0, which is how a capped row's share is measured.
 */
function split(
  group: SlotGroup,
  rows: readonly PlannerRow[],
  indexes: number[],
  asUncapped?: number,
) {
  const isCapped = (index: number) =>
    index !== asUncapped && rows[index].max > 0;
  const used = indexes
    .filter(isCapped)
    .reduce((sum, index) => sum + slotsFor(group, rows[index] as ItemRow), 0);
  const uncapped = indexes.filter((index) => !isCapped(index));
  const free = Math.max(0, group.slots - used);
  const base = Math.floor(free / uncapped.length);
  const remainder = free % uncapped.length;

  return new Map(
    uncapped.map((index, position) => [
      index,
      base + (position < remainder ? 1 : 0),
    ]),
  );
}

export function planOutputContainer(
  container: OutputContainer,
  rows: PlannerRow[],
): RowPlan[] {
  // A category row has no Stack size to split with, so it keeps its typed Max.
  const groups = rows.map((row) =>
    row.kind === "item" ? acceptingGroup(container, row) : null,
  );
  const shareSlots = new Map<number, number>();
  for (const group of container.slotGroups) {
    const indexes = rows.flatMap((_, index) =>
      groups[index] === group ? [index] : [],
    );
    for (const [index, slots] of split(group, rows, indexes)) {
      shareSlots.set(index, slots);
    }
    for (const index of indexes) {
      if (shareSlots.has(index)) continue;
      shareSlots.set(index, split(group, rows, indexes, index).get(index)!);
    }
  }

  return rows.map((row, index) => {
    const group = groups[index];
    if (row.kind === "category" || !group) {
      return {
        max: row.max,
        slotGroup: null,
        splitShare: null,
        rowCapacity: null,
        notAccepted: row.kind === "item",
        sharesSlots: false,
        aboveShare: false,
        aboveCapacity: false,
      };
    }

    const slots = shareSlots.get(index)!;
    // A 0 Max means no limit, so a row squeezed out still gets one stack.
    const splitShare = Math.max(slots, 1) * row.stackSize;
    const rowCapacity = capacityOf(group, row);
    return {
      max: row.max > 0 ? Math.min(row.max, rowCapacity) : splitShare,
      slotGroup: group.id,
      splitShare,
      rowCapacity,
      notAccepted: false,
      sharesSlots: row.max === 0 && slots === 0,
      aboveShare: row.max > splitShare,
      aboveCapacity: row.max > rowCapacity,
    };
  });
}
