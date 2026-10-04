"use client";

import * as React from "react";
import type {
  CreateFilter,
  CreateFilterInput,
} from "@/schemas/filterFormSchema";
import { SplitIcon } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useFormContext, useWatch } from "react-hook-form";

import { useCatalogue } from "@/hooks/use-catalogue";
import { EASE_OUT_STRONG } from "@/lib/motion";
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
  const reduceMotion = useReducedMotion();

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

  const collapsed = reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 };

  return (
    <div className='overflow-hidden rounded-xl bg-card shadow-xs ring-1 ring-foreground/10'>
      <FieldLabel
        htmlFor={checkboxId}
        className='w-full cursor-pointer items-start gap-3 px-4 py-3.5'
      >
        <Checkbox
          id={checkboxId}
          checked={selected !== null}
          disabled={catalogue.byId.size === 0}
          onCheckedChange={split.setTicked}
          className='mt-px'
        />
        <FieldContent>
          <FieldTitle>Output container</FieldTitle>
          <FieldDescription>
            Fit every row&apos;s Max to the container this conveyor fills
            through a Storage Adaptor. Ticking this rewrites your Max values.
          </FieldDescription>
        </FieldContent>
      </FieldLabel>
      <AnimatePresence initial={false}>
        {selected && (
          <motion.div
            key='controls'
            initial={collapsed}
            animate={{ height: "auto", opacity: 1 }}
            exit={{
              ...collapsed,
              transition: { duration: 0.15, ease: EASE_OUT_STRONG },
            }}
            transition={{ duration: 0.22, ease: EASE_OUT_STRONG }}
            className='overflow-hidden'
          >
            <div className='flex flex-wrap items-center gap-x-2 gap-y-3 border-t bg-muted/30 px-4 py-3'>
              <Select
                value={selected}
                onValueChange={(value) =>
                  split.pick(value as OutputContainerShortname)
                }
              >
                <SelectTrigger
                  aria-label='Output container'
                  className='min-w-0 flex-1 sm:min-w-75 sm:flex-none'
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
              <Button
                type='button'
                variant='outline'
                aria-label='Re-split'
                className='max-sm:w-9 max-sm:px-0'
                onClick={split.resplit}
              >
                <SplitIcon />
                <span className='max-sm:sr-only'>Re-split</span>
              </Button>
              {perfectSmelting.visible && (
                <Field
                  orientation='horizontal'
                  className='w-auto basis-full sm:ml-auto sm:basis-auto'
                >
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
          </motion.div>
        )}
      </AnimatePresence>
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
      width={20}
      height={20}
      unoptimized
      className='size-5 object-contain'
    />
  );
}
