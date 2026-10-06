import Link from "next/link";
import type { ItemIconRow } from "@/data/items";
import { ArrowRight } from "lucide-react";
import * as motion from "motion/react-client";

import { OUTPUT_CONTAINER_SHORTNAMES } from "@/lib/output-containers/container-table";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  HeaderSectionDescription,
  HeaderSectionEyebrow,
  HeaderSectionTitle,
} from "@/components/layout/header-sections";
import { ItemIcon } from "@/components/shared/item-icon";

export const STRIP_FEATURED_CONTAINER = "furnace.large";

export const STRIP_CONTAINERS = [
  "box.wooden.large",
  "cupboard.tool",
  "locker",
  "fridge",
  "vending.machine",
  "furnace",
  "small.oil.refinery",
  "dropbox",
] as const;

export function OutputContainersStrip({
  featured,
  containers,
}: {
  featured?: ItemIconRow;
  containers: ItemIconRow[];
}) {
  const shown = containers.length + (featured ? 1 : 0);
  const more = OUTPUT_CONTAINER_SHORTNAMES.length - shown;

  return (
    <section className='mx-auto max-w-7xl px-6 lg:px-8'>
      <motion.div
        initial={{ opacity: 0, filter: "blur(10px)" }}
        whileInView={{ opacity: 1, filter: "blur(0px)" }}
        viewport={{ once: true }}
        className='flex flex-col gap-10 rounded-2xl border bg-card/40 p-6 sm:p-10 lg:flex-row lg:items-center lg:justify-between lg:gap-16'
      >
        <div className='max-w-xl'>
          <HeaderSectionEyebrow>New in the filter form</HeaderSectionEyebrow>
          <HeaderSectionTitle className='text-3xl text-balance sm:text-4xl'>
            Filters sized to the box they fill
          </HeaderSectionTitle>
          <HeaderSectionDescription className='mt-4 text-base/7 sm:text-lg/8'>
            Pick the box, locker, cupboard or furnace your conveyor fills
            through a Storage Adaptor, and every row&apos;s Max is capped to the
            slots it has.
          </HeaderSectionDescription>
          <div className='mt-8 flex flex-wrap items-center gap-x-6 gap-y-4'>
            <Link href='/my-filters/new-filter' className={buttonVariants()}>
              Try it in a new filter
            </Link>
            <Link
              href='/filters'
              className={cn(buttonVariants({ variant: "link" }), "group")}
            >
              Browse filters by container
              <ArrowRight className='transition-transform group-hover:translate-x-0.5' />
            </Link>
          </div>
        </div>

        <div className='flex items-center justify-center gap-4 sm:gap-8'>
          {featured && (
            <div className='flex shrink-0 flex-col items-center gap-2'>
              <div className='rounded-2xl bg-linear-to-br from-[#4cc9f0]/15 to-[#4361ee]/15 p-2.5 ring-1 ring-[#4361ee]/30 sm:p-3'>
                <ItemIcon
                  imagePath={featured.imagePath}
                  version={featured.iconVersion}
                  size='full'
                  alt={featured.name}
                  width={96}
                  height={96}
                  unoptimized
                  className='size-16 object-contain sm:size-24'
                />
              </div>
              <span className='text-xs font-medium text-muted-foreground'>
                {featured.name}
              </span>
            </div>
          )}
          <ul className='grid shrink-0 grid-cols-3 gap-1.5 sm:gap-3'>
            {containers.map((container) => (
              <li
                key={container.shortname}
                title={container.name}
                className='flex size-12 items-center justify-center rounded-lg bg-muted/40 sm:size-16'
              >
                <ItemIcon
                  imagePath={container.imagePath}
                  version={container.iconVersion}
                  size='medium'
                  alt={container.name}
                  width={40}
                  height={40}
                  unoptimized
                  className='size-9 object-contain sm:size-10'
                />
              </li>
            ))}
            {more > 0 && (
              <li className='flex size-12 items-center justify-center rounded-lg bg-muted/40 text-sm font-semibold text-muted-foreground sm:size-16'>
                +{more}
              </li>
            )}
          </ul>
        </div>
      </motion.div>
    </section>
  );
}
