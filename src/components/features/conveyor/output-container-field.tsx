"use client";

import * as React from "react";
import type {
  CreateFilter,
  CreateFilterInput,
} from "@/schemas/filterFormSchema";
import { SplitIcon } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";

import { useCatalogue } from "@/hooks/use-catalogue";
import {
  OUTPUT_CONTAINER_SHORTNAMES,
  OUTPUT_CONTAINERS,
  type OutputContainerShortname,
} from "@/lib/output-containers/container-table";
import type { Item } from "@/db/schema";
import { Button } from "@/components/ui/button";
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
import { Switch } from "@/components/ui/switch";
import {
  useOutputContainerSplit,
  usePerfectSmeltingSwitch,
} from "@/components/features/conveyor/output-container-split";
import { ItemIcon } from "@/components/shared/item-icon";

type ContainerIconItem = Pick<Item, "name" | "imagePath" | "iconVersion">;
type ContainerOption = ContainerIconItem & {
  shortname: OutputContainerShortname;
};

export function OutputContainerField() {
  const { control } = useFormContext<
    CreateFilterInput,
    unknown,
    CreateFilter
  >();
  const selected = useWatch({ control, name: "outputContainer" }) ?? null;
  const catalogue = useCatalogue();
  const checkboxId = React.useId();
  const switchId = React.useId();
  const split = useOutputContainerSplit();
  const perfectSmelting = usePerfectSmeltingSwitch();

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
            onCheckedChange={split.setTicked}
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
        <div className='flex flex-wrap items-center gap-x-2 gap-y-3'>
          <Select
            value={selected}
            onValueChange={(value) =>
              split.pick(value as OutputContainerShortname)
            }
          >
            <SelectTrigger
              aria-label='Output container'
              className='h-auto! min-w-0 flex-1 py-1.5 sm:min-w-64 sm:flex-none'
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
          <Button type='button' variant='outline' onClick={split.resplit}>
            <SplitIcon />
            Re-split
          </Button>
          {perfectSmelting.visible && (
            <Field orientation='horizontal' className='w-auto'>
              <Switch
                id={switchId}
                checked={perfectSmelting.on}
                onCheckedChange={split.setPerfectSmelting}
              />
              <FieldLabel htmlFor={switchId} className='whitespace-nowrap'>
                Perfect smelting
              </FieldLabel>
            </Field>
          )}
        </div>
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
