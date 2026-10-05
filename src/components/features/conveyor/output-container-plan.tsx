"use client";

import * as React from "react";
import type {
  CreateFilter,
  CreateFilterInput,
} from "@/schemas/filterFormSchema";
import { useFormContext, useWatch } from "react-hook-form";

import { useCatalogue } from "@/hooks/use-catalogue";
import type { RowPlan } from "@/lib/output-containers/capacity-planner";
import { OUTPUT_CONTAINERS } from "@/lib/output-containers/container-table";
import {
  planFormRows,
  type FormRow,
} from "@/lib/output-containers/plan-form-rows";

interface OutputContainerPlan {
  containerName: string | null;
  plans: readonly (RowPlan | null)[];
}

const OutputContainerPlanContext = React.createContext<OutputContainerPlan>({
  containerName: null,
  plans: [],
});

export function OutputContainerPlanProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { control } = useFormContext<
    CreateFilterInput,
    unknown,
    CreateFilter
  >();
  const shortname = useWatch({ control, name: "outputContainer" });
  const rows = useWatch({ control, name: "items" }) as FormRow[] | undefined;
  const catalogue = useCatalogue();

  const value = React.useMemo<OutputContainerPlan>(() => {
    if (!shortname || !rows) return { containerName: null, plans: [] };
    return {
      containerName: catalogue.byShortname.get(shortname)?.name ?? null,
      plans: planFormRows(OUTPUT_CONTAINERS[shortname], rows, catalogue.byId),
    };
  }, [shortname, rows, catalogue]);

  return (
    <OutputContainerPlanContext.Provider value={value}>
      {children}
    </OutputContainerPlanContext.Provider>
  );
}

export function useRowPlan(index: number) {
  const { containerName, plans } = React.useContext(OutputContainerPlanContext);
  const plan = plans[index] ?? null;
  return plan && containerName ? { plan, containerName } : null;
}
