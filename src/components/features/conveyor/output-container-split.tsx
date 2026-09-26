"use client";

import * as React from "react";
import type {
  CreateFilter,
  CreateFilterInput,
} from "@/schemas/filterFormSchema";
import { useFormContext } from "react-hook-form";
import { toast } from "sonner";

import { type NewConveyorItem } from "@/types/item";
import { useCatalogue } from "@/hooks/use-catalogue";
import {
  OUTPUT_CONTAINERS,
  type OutputContainerShortname,
} from "@/lib/output-containers/container-table";
import {
  fitAddedRow,
  maxOf,
  rowKey,
  splitFormRows,
  type FormRow,
} from "@/lib/output-containers/plan-form-rows";

type SplitWritten = React.RefObject<Map<string, number>>;

const SplitWrittenContext = React.createContext<SplitWritten | null>(null);

export function OutputContainerSplitProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const written = React.useRef(new Map<string, number>());
  return <SplitWrittenContext value={written}>{children}</SplitWrittenContext>;
}

function useSplitWritten() {
  const written = React.useContext(SplitWrittenContext);
  if (!written) {
    throw new Error(
      "useOutputContainerSplit must be used within an OutputContainerSplitProvider",
    );
  }
  return written;
}

export function useOutputContainerSplit() {
  const written = useSplitWritten();
  const { getValues, setValue } = useFormContext<
    CreateFilterInput,
    unknown,
    CreateFilter
  >();
  const catalogue = useCatalogue();

  function setMax(index: number, max: number) {
    setValue(`items.${index}.max`, max, { shouldDirty: true });
  }

  /** Splits every row, then offers an undo that puts the container back too. */
  function pick(shortname: OutputContainerShortname | null) {
    const containerBefore = getValues("outputContainer") ?? null;
    const writtenBefore = written.current;
    setValue("outputContainer", shortname, { shouldDirty: true });
    if (!shortname) {
      written.current = new Map();
      return;
    }

    const rows = getValues("items") as FormRow[];
    if (rows.length === 0) return;
    const previous = new Map(rows.map((row) => [rowKey(row), maxOf(row)]));
    const split = splitFormRows(
      OUTPUT_CONTAINERS[shortname],
      rows,
      catalogue.byId,
      written.current,
    );
    written.current = split.written;
    split.maxes.forEach((max, index) => {
      if (max !== null && max !== maxOf(rows[index])) setMax(index, max);
    });

    toast(`Max values fit to ${catalogue.byShortname.get(shortname)?.name}`, {
      action: {
        label: "Undo",
        onClick: () => {
          setValue("outputContainer", containerBefore, { shouldDirty: true });
          written.current = writtenBefore;
          // By key, since rows may have moved or gone since the split.
          (getValues("items") as FormRow[]).forEach((row, index) => {
            const max = previous.get(rowKey(row));
            if (max !== undefined) setMax(index, max);
          });
        },
      },
    });
  }

  function resplit() {
    const shortname = getValues("outputContainer");
    if (shortname) pick(shortname);
  }

  function fitNewRow<T extends NewConveyorItem>(item: T): T {
    const shortname = getValues("outputContainer");
    if (!shortname) return item;
    const fit = fitAddedRow(
      OUTPUT_CONTAINERS[shortname],
      getValues("items") as FormRow[],
      item,
      catalogue.byId,
      written.current,
    );
    written.current = fit.written;
    return { ...item, max: fit.max };
  }

  return { pick, resplit, fitNewRow };
}
