import type { OutputContainer } from "@/lib/output-containers/container-table";
import {
  maxOf,
  rowKey,
  type FormRow,
} from "@/lib/output-containers/plan-form-rows";

export function hasSeenTour(
  metadata: UserUnsafeMetadata | undefined,
  tour: string,
): boolean {
  return metadata?.seenTours?.includes(tour) ?? false;
}

// Clerk's frontend user.update() replaces unsafeMetadata instead of merging it.
export function withSeenTour(
  metadata: UserUnsafeMetadata | undefined,
  tour: string,
): UserUnsafeMetadata {
  const seenTours = metadata?.seenTours ?? [];
  if (seenTours.includes(tour)) return { ...metadata };
  return { ...metadata, seenTours: [...seenTours, tour] };
}

/** Smelt items for an oven demo, one per input slot so none share a slot. */
export function ovenSampleShortnames(oven: OutputContainer): string[] {
  const input = oven.slotGroups.find((group) => group.id === "input");
  const takesInput = (shortname: string) =>
    input?.accepts.kind === "items" &&
    input.accepts.shortnames.includes(shortname);
  const smelt = Object.keys(oven.keepLitMax ?? {});
  return [
    ...smelt.filter((shortname) => !takesInput(shortname)),
    ...smelt.filter(takesInput).slice(0, input?.slots ?? 0),
  ];
}

/** Indexes whose Max differs, or null when the rows themselves differ. */
export function maxChanges(
  before: readonly FormRow[],
  after: readonly FormRow[],
): number[] | null {
  if (before.length !== after.length) return null;
  if (before.some((row, index) => rowKey(row) !== rowKey(after[index]))) {
    return null;
  }
  return after.flatMap((row, index) =>
    maxOf(row) === maxOf(before[index]) ? [] : [index],
  );
}
