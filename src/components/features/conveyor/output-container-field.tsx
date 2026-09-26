"use client";

import * as React from "react";
import type {
  CreateFilter,
  CreateFilterInput,
} from "@/schemas/filterFormSchema";
import { useFormContext, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { useCatalogue } from "@/hooks/use-catalogue";
import {
  OUTPUT_CONTAINER_SHORTNAMES,
  OUTPUT_CONTAINERS,
  type OutputContainerShortname,
} from "@/lib/output-containers/container-table";
import {
  maxOf,
  planFormRows,
  rowKey,
  type FormRow,
} from "@/lib/output-containers/plan-form-rows";
import type { Item } from "@/db/schema";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ItemIcon } from "@/components/shared/item-icon";

const DEFAULT_CONTAINER: OutputContainerShortname = "box.wooden.large";

type ContainerIconItem = Pick<Item, "name" | "imagePath" | "iconVersion">;
type ContainerOption = ContainerIconItem & {
  shortname: OutputContainerShortname;
};

export function OutputContainerField() {
  const { control, getValues, setValue } = useFormContext<
    CreateFilterInput,
    unknown,
    CreateFilter
  >();
  const selected = useWatch({ control, name: "outputContainer" }) ?? null;
  const catalogue = useCatalogue();
  const checkboxId = React.useId();

  const options = React.useMemo(() => {
    const groups = new Map<string, ContainerOption[]>();
    for (const shortname of OUTPUT_CONTAINER_SHORTNAMES) {
      const item = catalogue.byShortname.get(shortname);
      if (!item) continue;
      const label = OUTPUT_CONTAINERS[shortname].capacityGroup;
      const { name, imagePath, iconVersion } = item;
      groups.set(label, [
        ...(groups.get(label) ?? []),
        { shortname, name, imagePath, iconVersion },
      ]);
    }
    return groups;
  }, [catalogue]);

  const optionFor = (shortname: string | null) =>
    shortname ? catalogue.byShortname.get(shortname) : undefined;

  // Values the last split wrote into rows that were at 0. A row still holding
  // one of them hasn't been capped by the author, so a new pick re-splits it.
  const splitWritten = React.useRef(new Map<string, number>());

  /** Rewrites every row's Max and returns the Max values it replaced. */
  function applyPlan(shortname: OutputContainerShortname) {
    const rows = getValues("items") as FormRow[];
    const previous = new Map(rows.map((row) => [rowKey(row), maxOf(row)]));
    const leftToSplit = (row: FormRow) => {
      const max = previous.get(rowKey(row))!;
      return max === 0 || splitWritten.current.get(rowKey(row)) === max;
    };
    const plans = planFormRows(
      OUTPUT_CONTAINERS[shortname],
      rows,
      catalogue.byId,
      leftToSplit,
    );

    const written = new Map<string, number>();
    rows.forEach((row, index) => {
      const plan = plans[index];
      if (!plan) return;
      if (leftToSplit(row)) written.set(rowKey(row), plan.max);
      if (plan.max !== previous.get(rowKey(row))) {
        setValue(`items.${index}.max`, plan.max, { shouldDirty: true });
      }
    });
    splitWritten.current = written;
    return previous;
  }

  function pickContainer(shortname: OutputContainerShortname | null) {
    const containerBefore = getValues("outputContainer") ?? null;
    const writtenBefore = splitWritten.current;
    setValue("outputContainer", shortname, { shouldDirty: true });
    if (!shortname) {
      splitWritten.current = new Map();
      return;
    }

    const previous = applyPlan(shortname);
    if (previous.size === 0) return;
    toast(`Max values fit to ${optionFor(shortname)?.name}`, {
      action: {
        label: "Undo",
        onClick: () => {
          setValue("outputContainer", containerBefore, { shouldDirty: true });
          splitWritten.current = writtenBefore;
          (getValues("items") as FormRow[]).forEach((row, index) => {
            const max = previous.get(rowKey(row));
            if (max === undefined) return;
            setValue(`items.${index}.max`, max, { shouldDirty: true });
          });
        },
      },
    });
  }

  const current = optionFor(selected);

  return (
    <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
      <FieldLabel htmlFor={checkboxId} className='sm:max-w-md'>
        <Field orientation='horizontal'>
          <Checkbox
            id={checkboxId}
            checked={selected !== null}
            // Without the catalogue there are no stack sizes to split with.
            disabled={catalogue.byId.size === 0}
            onCheckedChange={(checked) =>
              pickContainer(checked ? DEFAULT_CONTAINER : null)
            }
          />
          <FieldContent>
            <FieldTitle>Output container</FieldTitle>
            <FieldDescription>
              Fit every row&apos;s Max to the container this conveyor fills
              through a Storage Adaptor. Ticking this rewrites your Max values.
            </FieldDescription>
          </FieldContent>
        </Field>
      </FieldLabel>
      {selected && (
        <Select
          value={selected}
          onValueChange={(value) =>
            pickContainer(value as OutputContainerShortname)
          }
        >
          <SelectTrigger
            aria-label='Output container'
            className='h-auto! w-full min-w-64 py-1.5 sm:w-auto'
          >
            <SelectValue>
              {current && (
                <>
                  <ContainerIcon {...current} />
                  {current.name}
                </>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {[...options].map(([label, containers]) => (
              <SelectGroup key={label}>
                <SelectLabel>{label}</SelectLabel>
                {containers.map((container) => (
                  <SelectItem
                    key={container.shortname}
                    value={container.shortname}
                    className='*:items-center'
                  >
                    <ContainerIcon {...container} />
                    {container.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

function ContainerIcon({ name, imagePath, iconVersion }: ContainerIconItem) {
  return (
    <ItemIcon
      imagePath={imagePath}
      version={iconVersion}
      size='tiny'
      alt={name}
      width={24}
      height={24}
      unoptimized
      className='size-6 object-contain'
    />
  );
}
