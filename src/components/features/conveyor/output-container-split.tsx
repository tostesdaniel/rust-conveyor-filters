"use client";

import * as React from "react";
import type {
  CreateFilter,
  CreateFilterInput,
} from "@/schemas/filterFormSchema";
import { useFormContext, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { type NewConveyorItem } from "@/types/item";
import { useCatalogue } from "@/hooks/use-catalogue";
import type { PerfectSmelting } from "@/lib/output-containers/capacity-planner";
import {
  OUTPUT_CONTAINERS,
  type OutputContainer,
  type OutputContainerShortname,
} from "@/lib/output-containers/container-table";
import {
  fitAddedRow,
  maxOf,
  perfectSmeltingOfForm,
  rowKey,
  seedWritten,
  splitFormRows,
  switchPerfectSmelting,
  type CatalogueItem,
  type FormRow,
} from "@/lib/output-containers/plan-form-rows";
import { maxChanges } from "@/lib/tours";

const DEFAULT_CONTAINER: OutputContainerShortname = "box.wooden.large";

type PickListener = (shortname: OutputContainerShortname | null) => void;

interface SplitState {
  written: React.RefObject<Map<string, number>>;
  /** Container restored when the checkbox is ticked again. */
  lastContainer: React.RefObject<OutputContainerShortname>;
  /** Used when there is no oven or no Smelt rows. */
  ownSwitch: boolean;
  setOwnSwitch: (on: boolean) => void;
  pickListeners: React.RefObject<Set<PickListener>>;
}

const SplitStateContext = React.createContext<SplitState | null>(null);

const isOven = (
  container: OutputContainer | null,
): container is OutputContainer => !!container?.keepLitMax;

const containerOf = (shortname: OutputContainerShortname | null) =>
  shortname ? OUTPUT_CONTAINERS[shortname] : null;

function checkFor(
  container: OutputContainer | null,
  rows: readonly FormRow[],
  catalogue: ReadonlyMap<number, CatalogueItem>,
): PerfectSmelting {
  return isOven(container)
    ? perfectSmeltingOfForm(container, rows, catalogue)
    : "noSmeltRows";
}

const switchOnFor = (check: PerfectSmelting, ownSwitch: boolean) =>
  check === "noSmeltRows" ? ownSwitch : check === "on";

export interface LoadedValues {
  outputContainer: OutputContainerShortname | null;
  items: FormRow[];
}

/** `perfectSmelting` is the switch state kept for when no Smelt rows decide it. */
export function OutputContainerSplitProvider({
  saved,
  perfectSmelting: ownSwitch,
  onPerfectSmeltingChange: setOwnSwitch,
  children,
}: {
  saved?: LoadedValues | null;
  perfectSmelting: boolean;
  onPerfectSmeltingChange: (on: boolean) => void;
  children: React.ReactNode;
}) {
  const [unseeded] = React.useState(() => new Map<string, number>());
  const written = React.useRef(unseeded);
  const lastContainer = React.useRef(DEFAULT_CONTAINER);
  const pickListeners = React.useRef(new Set<PickListener>());
  const catalogue = useCatalogue();

  React.useEffect(() => {
    if (!saved?.outputContainer) return;
    // Wait for the catalogue, since seeding needs stack sizes.
    if (catalogue.byId.size === 0) return;
    // Skip seeding if a pick or added row already wrote.
    if (written.current !== unseeded) return;
    written.current = seedWritten(
      OUTPUT_CONTAINERS[saved.outputContainer],
      saved.items,
      catalogue.byId,
    );
  }, [saved, catalogue, unseeded]);

  return (
    <SplitStateContext
      value={{ written, lastContainer, ownSwitch, setOwnSwitch, pickListeners }}
    >
      {children}
    </SplitStateContext>
  );
}

function useSplitState() {
  const state = React.useContext(SplitStateContext);
  if (!state) {
    throw new Error(
      "Output container hooks must be used within an OutputContainerSplitProvider",
    );
  }
  return state;
}

/** Called when the user picks a container or ticks the card, not on loads. */
export function useOnContainerPick(listener: PickListener) {
  const { pickListeners } = useSplitState();
  const latest = React.useRef(listener);
  React.useEffect(() => {
    latest.current = listener;
  });
  React.useEffect(() => {
    const listeners = pickListeners.current;
    const call: PickListener = (shortname) => latest.current(shortname);
    listeners.add(call);
    return () => {
      listeners.delete(call);
    };
  }, [pickListeners]);
}

export function usePerfectSmeltingSwitch() {
  const { ownSwitch, setOwnSwitch } = useSplitState();
  const { control } = useFormContext<
    CreateFilterInput,
    unknown,
    CreateFilter
  >();
  const shortname = useWatch({ control, name: "outputContainer" }) ?? null;
  const rows = useWatch({ control, name: "items" }) as FormRow[] | undefined;
  const catalogue = useCatalogue();
  const container = containerOf(shortname);
  const check = checkFor(container, rows ?? [], catalogue.byId);

  // Remember the rows' answer so removing Smelt rows keeps it.
  React.useEffect(() => {
    if (check !== "noSmeltRows") setOwnSwitch(check === "on");
  }, [check, setOwnSwitch]);

  return {
    visible: isOven(container),
    on: switchOnFor(check, ownSwitch),
  };
}

export interface PreviewRows {
  items: CreateFilterInput["items"];
  written: Map<string, number>;
}

export interface SplitSnapshot {
  values: CreateFilterInput;
  written: Map<string, number>;
  lastContainer: OutputContainerShortname;
  ownSwitch: boolean;
}

export function useOutputContainerSplit() {
  const { written, lastContainer, ownSwitch, setOwnSwitch, pickListeners } =
    useSplitState();
  const { getValues, setValue, reset } = useFormContext<
    CreateFilterInput,
    unknown,
    CreateFilter
  >();
  const catalogue = useCatalogue();

  function setMax(index: number, max: number) {
    setValue(`items.${index}.max`, max, { shouldDirty: true });
  }

  const formRows = () => getValues("items") as FormRow[];
  const switchOn = (shortname: OutputContainerShortname | null) =>
    switchOnFor(
      checkFor(containerOf(shortname), formRows(), catalogue.byId),
      ownSwitch,
    );
  const maxesByKey = (rows: readonly FormRow[]) =>
    new Map(rows.map((row) => [rowKey(row), maxOf(row)]));

  function applyMaxes(rows: readonly FormRow[], maxes: (number | null)[]) {
    maxes.forEach((max, index) => {
      if (max !== null && max !== maxOf(rows[index])) setMax(index, max);
    });
  }

  // By key, since rows may have moved or gone since the rewrite.
  function restoreMaxes(previous: ReadonlyMap<string, number>) {
    formRows().forEach((row, index) => {
      const max = previous.get(rowKey(row));
      if (max !== undefined) setMax(index, max);
    });
  }

  function fit(
    shortname: OutputContainerShortname | null,
    perfectSmelting: boolean,
  ) {
    const containerBefore = getValues("outputContainer") ?? null;
    const writtenBefore = written.current;
    setValue("outputContainer", shortname, { shouldDirty: true });
    if (!shortname) {
      if (containerBefore) lastContainer.current = containerBefore;
      written.current = new Map();
      return;
    }

    const rows = formRows();
    if (rows.length === 0) return;
    const previous = maxesByKey(rows);
    const planned = splitFormRows(
      OUTPUT_CONTAINERS[shortname],
      rows,
      catalogue.byId,
      written.current,
      { perfectSmelting },
    );
    written.current = planned.written;
    applyMaxes(rows, planned.maxes);

    toast(`Max values fit to ${catalogue.byShortname.get(shortname)?.name}`, {
      action: {
        label: "Undo",
        onClick: () => {
          setValue("outputContainer", containerBefore, { shouldDirty: true });
          written.current = writtenBefore;
          restoreMaxes(previous);
        },
      },
    });
  }

  function pick(shortname: OutputContainerShortname | null) {
    const before = getValues("outputContainer") ?? null;
    fit(shortname, isOven(containerOf(shortname)) && switchOn(before));
    for (const listener of pickListeners.current) listener(shortname);
  }

  function setTicked(ticked: boolean) {
    pick(ticked ? lastContainer.current : null);
  }

  // Perfect smelting off, so lowered Smelt rows are not overwritten.
  function resplit() {
    const shortname = getValues("outputContainer");
    if (shortname) fit(shortname, false);
  }

  function setPerfectSmelting(on: boolean) {
    const ownBefore = ownSwitch;
    setOwnSwitch(on);
    const shortname = getValues("outputContainer");
    if (!shortname) return;

    const container = OUTPUT_CONTAINERS[shortname];
    const rows = formRows();
    if (checkFor(container, rows, catalogue.byId) === "noSmeltRows") return;
    const switched = switchPerfectSmelting(
      container,
      rows,
      catalogue.byId,
      written.current,
      on,
    );
    const previous = maxesByKey(rows);
    const writtenBefore = written.current;
    written.current = switched.written;
    applyMaxes(rows, switched.maxes);

    const name = catalogue.byShortname.get(shortname)?.name;
    toast(
      on
        ? `Max values fit to ${name} in Perfect smelting`
        : `Max values fit to ${name}`,
      {
        action: {
          label: "Undo",
          onClick: () => {
            setOwnSwitch(ownBefore);
            written.current = writtenBefore;
            restoreMaxes(previous);
          },
        },
      },
    );
  }

  function fitNewRow<T extends NewConveyorItem>(item: T): T {
    const shortname = getValues("outputContainer");
    if (!shortname) return item;
    const added = fitAddedRow(
      OUTPUT_CONTAINERS[shortname],
      formRows(),
      item,
      catalogue.byId,
      written.current,
      { perfectSmelting: switchOn(shortname) },
    );
    written.current = added.written;
    return { ...item, max: added.max };
  }

  function snapshot(): SplitSnapshot {
    return {
      values: structuredClone(getValues()),
      written: written.current,
      lastContainer: lastContainer.current,
      ownSwitch,
    };
  }

  function restore(saved: SplitSnapshot) {
    reset(saved.values, {
      keepDefaultValues: true,
      keepErrors: true,
      keepTouched: true,
      keepIsSubmitted: true,
      keepSubmitCount: true,
    });
    written.current = saved.written;
    lastContainer.current = saved.lastContainer;
    setOwnSwitch(saved.ownSwitch);
  }

  /** Shows a container with no toast or Undo. Without rows, each Max stays. */
  function preview(
    shortname: OutputContainerShortname | null,
    rows?: PreviewRows,
  ) {
    setValue("outputContainer", shortname);
    if (!rows) return;
    written.current = rows.written;
    const current = formRows();
    const next = rows.items as FormRow[];
    const changes = maxChanges(current, next);
    if (!changes) {
      setValue("items", rows.items);
      return;
    }
    // Per row, so the inputs stay mounted.
    for (const index of changes) {
      setValue(`items.${index}.max`, maxOf(next[index]));
    }
  }

  return {
    pick,
    setTicked,
    resplit,
    setPerfectSmelting,
    fitNewRow,
    snapshot,
    restore,
    preview,
  };
}
