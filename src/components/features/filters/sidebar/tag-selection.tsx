"use client";

import { useMemo, useState } from "react";
import { api } from "@/trpc/react";
import { trackEvent } from "@/utils/rybbit";
import { CheckIcon, ChevronsUpDownIcon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { useSearchParams } from "@/hooks/useSearchParams";
import { MAX_FILTER_TAGS } from "@/lib/ai/tag-limits";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

export function TagSelection() {
  const [{ tags }, setSearchParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const { data: available, isLoading } = api.tag.listActive.useQuery(
    undefined,
    {
      staleTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
    },
  );

  const tagsList = useMemo(() => available ?? [], [available]);

  const selectedLabels = useMemo(() => {
    const map = new Map(tagsList.map((t) => [t.slug, t.label]));
    return (tags ?? []).map((slug) => ({
      slug,
      label: map.get(slug) ?? slug,
    }));
  }, [tags, tagsList]);

  if (tagsList.length === 0 && !isLoading) return null;

  const handleToggle = (slug: string) => {
    const current = tags ?? [];
    const isSelected = current.includes(slug);

    if (isSelected) {
      trackEvent("filter_tag_toggled", { tag: slug, selected: false });
      setSearchParams({ tags: current.filter((t) => t !== slug) });
      return;
    }

    if (current.length >= MAX_FILTER_TAGS) {
      toast.warning("Tag limit reached", {
        description: `You can only select up to ${MAX_FILTER_TAGS} tags at a time.`,
      });
      return;
    }

    trackEvent("filter_tag_toggled", { tag: slug, selected: true });
    setSearchParams({ tags: [...current, slug] });
  };

  const selectedCount = tags?.length ?? 0;

  return (
    <SidebarGroup className='mt-2'>
      <SidebarMenu>
        <SidebarMenuItem className='px-2'>
          {isLoading ? (
            <div className='flex flex-col gap-2 pt-1.5'>
              <div className='relative w-full overflow-visible'>
                <span
                  className='pointer-events-none absolute -top-[3px] left-2 z-10 -translate-y-1/2 rounded-sm border border-emerald-950/20 bg-emerald-900 px-1.5 py-0.5 text-[10px] leading-none font-bold tracking-wide text-emerald-50 uppercase shadow-sm ring-1 ring-sidebar select-none dark:border-emerald-800/50 dark:bg-emerald-950 dark:text-emerald-100'
                  title='New — filter by tags'
                  aria-hidden
                >
                  New
                </span>
                <div
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "pointer-events-none w-full justify-between gap-2 pr-1.5 pl-3 font-normal",
                  )}
                  aria-hidden
                >
                  <Skeleton className='h-4 w-9' />
                  <span className='flex items-center gap-1'>
                    <Skeleton className='h-3.5 w-10' />
                    <ChevronsUpDownIcon className='size-4 shrink-0 opacity-50' />
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className='flex flex-col gap-2 pt-1.5'>
              <Popover open={open} onOpenChange={setOpen}>
                <div className='relative w-full overflow-visible'>
                  <span
                    className='pointer-events-none absolute -top-[3px] left-2 z-10 -translate-y-1/2 rounded-sm border border-emerald-950/20 bg-emerald-900 px-1.5 py-0.5 text-[10px] leading-none font-bold tracking-wide text-emerald-50 uppercase shadow-sm ring-1 ring-sidebar select-none dark:border-emerald-800/50 dark:bg-emerald-950 dark:text-emerald-100'
                    title='New — filter by tags'
                    aria-hidden
                  >
                    New
                  </span>
                  <PopoverTrigger asChild>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      role='combobox'
                      aria-expanded={open}
                      className='w-full justify-between gap-2 pr-1.5 pl-3 font-normal'
                    >
                      <span>Tags</span>
                      <span className='flex items-center gap-1'>
                        <span
                          className={cn(
                            "text-xs font-normal tabular-nums",
                            selectedCount === 0
                              ? "text-muted-foreground"
                              : selectedCount <= 2
                                ? "text-green-600 dark:text-green-400"
                                : selectedCount <= 4
                                  ? "text-yellow-600 dark:text-yellow-400"
                                  : "text-red-600 dark:text-red-400",
                          )}
                        >
                          {selectedCount}/{MAX_FILTER_TAGS}
                        </span>
                        <ChevronsUpDownIcon className='size-4 shrink-0 opacity-50' />
                      </span>
                    </Button>
                  </PopoverTrigger>
                </div>
                <PopoverContent
                  className='w-(--radix-popover-trigger-width) p-0'
                  align='start'
                  side='bottom'
                >
                  <Command>
                    <CommandInput placeholder='Search tags...' />
                    <CommandList>
                      <CommandEmpty>No tags found.</CommandEmpty>
                      <CommandGroup>
                        {tagsList.map((tag) => {
                          const checked = tags?.includes(tag.slug) ?? false;
                          return (
                            <CommandItem
                              key={tag.slug}
                              value={`${tag.slug} ${tag.label}`}
                              onSelect={() => {
                                handleToggle(tag.slug);
                              }}
                            >
                              <span className='flex min-w-0 flex-1 items-center gap-1'>
                                <span className='truncate'>{tag.label}</span>
                                <CheckIcon
                                  className={cn(
                                    "size-4 shrink-0",
                                    checked ? "opacity-100" : "opacity-0",
                                  )}
                                />
                              </span>
                              {tag.usageCount > 0 ? (
                                <span className='shrink-0 text-[10px] text-muted-foreground tabular-nums'>
                                  {tag.usageCount}
                                </span>
                              ) : null}
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {selectedLabels.length > 0 ? (
                <div className='flex flex-wrap gap-1'>
                  {selectedLabels.map((t) => (
                    <Badge
                      key={t.slug}
                      variant='secondary'
                      className='gap-0.5 pr-0.5 text-xs font-normal'
                    >
                      {t.label}
                      <button
                        type='button'
                        className='rounded-sm p-0.5 hover:bg-muted'
                        onClick={() => handleToggle(t.slug)}
                        aria-label={`Remove ${t.label}`}
                      >
                        <XIcon className='size-3' />
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
