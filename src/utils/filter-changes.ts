export interface FilterItemValues {
  itemId: number | null;
  categoryId: number | null;
  max: number;
  buffer: number;
  min: number;
  position: number;
}

export interface FilterContent {
  name: string;
  description: string | null;
  imagePath: string;
  outputContainerId: number | null;
  isPublic: boolean | null;
}

const sameRow = (a: FilterItemValues, b: FilterItemValues) =>
  a.categoryId !== null
    ? a.categoryId === b.categoryId
    : a.itemId !== null && a.itemId === b.itemId;

/** Incoming rows whose max, buffer, min or position differ from the stored row. */
export function changedItemRows<T extends FilterItemValues>(
  existing: FilterItemValues[],
  incoming: T[],
): T[] {
  return incoming.filter((row) => {
    const stored = existing.find((e) => sameRow(row, e));
    return (
      !stored ||
      stored.max !== row.max ||
      stored.buffer !== row.buffer ||
      stored.min !== row.min ||
      stored.position !== row.position
    );
  });
}

/**
 * Whether an edit changes what a viewer sees or what the game filter does.
 * Moving between folders and unpublishing do not count; publishing does.
 */
export function isContentChange(
  current: FilterContent,
  next: Partial<FilterContent>,
): boolean {
  return (
    (next.name !== undefined && next.name !== current.name) ||
    (next.description !== undefined &&
      (next.description ?? "") !== (current.description ?? "")) ||
    (next.imagePath !== undefined && next.imagePath !== current.imagePath) ||
    (next.outputContainerId !== undefined &&
      next.outputContainerId !== current.outputContainerId) ||
    (next.isPublic === true && !current.isPublic)
  );
}
