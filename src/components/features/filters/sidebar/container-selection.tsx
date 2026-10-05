"use client";

import { useRef } from "react";
import { api } from "@/trpc/react";
import { trackEvent } from "@/utils/rybbit";
import { XIcon } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { useCatalogue } from "@/hooks/use-catalogue";
import { useSearchParams } from "@/hooks/useSearchParams";
import { EASE_OUT_STRONG } from "@/lib/motion";
import type { OutputContainerShortname } from "@/lib/output-containers/container-table";
import { cn } from "@/lib/utils";
import type { Item } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { ItemIcon } from "@/components/shared/item-icon";

type ContainerIconItem = Pick<Item, "name" | "imagePath" | "iconVersion">;

export function ContainerSelection() {
  const [{ container }, setSearchParams] = useSearchParams();
  const catalogue = useCatalogue();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const reduceMotion = useReducedMotion();
  const { data: counts, isPending } = api.filter.getContainerCounts.useQuery(
    undefined,
    {
      staleTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
    },
  );

  const options = counts ?? [];
  if (!isPending && options.length === 0 && !container) return null;

  // Use the catalogue, since counts omit containers with no public filters.
  const current = container ? catalogue.byShortname.get(container) : undefined;

  const handleChange = (shortname: OutputContainerShortname | null) => {
    trackEvent("browse_container_changed", { container: shortname ?? "none" });
    setSearchParams({ container: shortname });
  };

  const collapsed = reduceMotion ? { opacity: 0 } : { width: 0, opacity: 0 };

  return (
    <SidebarGroup>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton className='font-semibold hover:bg-transparent active:bg-transparent'>
            Container
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem className='px-2'>
          {isPending ? (
            <Skeleton className='h-8 w-full' />
          ) : (
            <Select value={container} onValueChange={handleChange}>
              <ButtonGroup className='w-full'>
                <SelectTrigger
                  ref={triggerRef}
                  size='sm'
                  aria-label='Output container'
                  className={cn("min-w-0 flex-1 py-0.5", current && "pl-1.5")}
                >
                  <SelectValue>
                    {current ? (
                      <>
                        <ContainerIcon {...current} />
                        <span className='truncate'>{current.name}</span>
                      </>
                    ) : (
                      <span className='text-muted-foreground'>
                        Any container
                      </span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <AnimatePresence initial={false}>
                  {container && (
                    <Button
                      key='clear'
                      type='button'
                      variant='outline'
                      size='icon-sm'
                      aria-label='Clear container'
                      className='overflow-hidden'
                      render={
                        <motion.button
                          initial={collapsed}
                          animate={{ width: "2rem", opacity: 1 }}
                          exit={{
                            ...collapsed,
                            transition: {
                              duration: 0.15,
                              ease: EASE_OUT_STRONG,
                            },
                          }}
                          transition={{ duration: 0.2, ease: EASE_OUT_STRONG }}
                        />
                      }
                      onClick={() => {
                        handleChange(null);
                        triggerRef.current?.focus();
                      }}
                    >
                      <XIcon />
                    </Button>
                  )}
                </AnimatePresence>
              </ButtonGroup>
              <SelectContent
                align='start'
                className='w-auto min-w-(--anchor-width)'
              >
                <SelectGroup>
                  {options.map((option) => (
                    <SelectItem
                      key={option.shortname}
                      value={option.shortname}
                      className='*:items-center'
                    >
                      <ContainerIcon {...option} />
                      <span className='min-w-0 flex-1 truncate'>
                        {option.name}
                      </span>
                      <span className='shrink-0 text-[10px] text-muted-foreground tabular-nums'>
                        {option.count}
                      </span>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
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
      className='size-6 shrink-0 object-contain'
    />
  );
}
