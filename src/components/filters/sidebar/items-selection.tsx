"use client";

import React, { useCallback, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { CirclePlusIcon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { useGetItems } from "@/hooks/use-get-items";
import { useSearchParams } from "@/hooks/useSearchParams";
import { cn } from "@/lib/utils";
import { getR2ImageUrl } from "@/lib/utils/r2-images";
import { items } from "@/db/schema";
import { Button } from "@/components/ui/button";
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
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

export function ItemsSelection() {
  const { data: itemsData, isLoading: itemsLoading } = useGetItems();
  const [{ items }, setSearchParams] = useSearchParams();
  const [isLoading, startTransition] = useTransition();

  const handleRemoveItem = useCallback(
    (item: string) => {
      const newItems =
        items && items.length > 1 ? items.filter((i) => i !== item) : null;
      setSearchParams(
        { items: newItems },
        {
          startTransition,
          shallow: false,
          limitUrlUpdates: {
            method: "throttle",
            timeMs: 500,
          },
        },
      );
    },
    [items, setSearchParams],
  );

  return (
    <SidebarGroup>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton className='font-semibold hover:bg-transparent active:bg-transparent'>
            Items
            <span
              className={cn(
                "ml-auto text-xs",
                !items?.length
                  ? "text-muted-foreground"
                  : items.length <= 2
                    ? "text-green-600 dark:text-green-400"
                    : items.length <= 4
                      ? "text-yellow-600 dark:text-yellow-400"
                      : "text-red-600 dark:text-red-400",
              )}
            >
              {items?.length ?? 0}/5
            </span>
          </SidebarMenuButton>
        </SidebarMenuItem>

        {itemsLoading || !itemsData?.data ? (
          <SidebarMenuItem className='px-2'>
            <Skeleton className='h-8 w-full' />
          </SidebarMenuItem>
        ) : (
          <>
            <SidebarMenuItem className='px-2'>
              <ItemsCombobox />
            </SidebarMenuItem>
            <SidebarMenuSub className='mr-0' hidden={!items?.length}>
              {items?.map((item) => {
                const foundItem = itemsData?.data?.find((i) => i.name === item);
                return foundItem ? (
                  <SidebarMenuSubItem key={item}>
                    <SidebarMenuSubButton className='h-8' asChild>
                      <div
                        className={cn(
                          "group relative pr-7",
                          isLoading && "pointer-events-none opacity-50",
                        )}
                        onClick={() => {
                          if (!isLoading) {
                            handleRemoveItem(item);
                          }
                        }}
                      >
                        <Item item={foundItem} truncate />
                        <Button
                          variant='destructive'
                          size='icon'
                          className='absolute top-[9px] right-1.5 size-3.5 shadow-none group-hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40'
                          disabled={isLoading}
                        >
                          <XIcon
                            className='size-3'
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isLoading) {
                                handleRemoveItem(item);
                              }
                            }}
                          />
                        </Button>
                      </div>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ) : null;
              })}
            </SidebarMenuSub>
          </>
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}

function ItemsCombobox({
  className,
  ...props
}: React.ComponentProps<"button">) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const { data: itemsData } = useGetItems();
  const [{ items }, setSearchParams] = useSearchParams();
  const [isLoading, startTransition] = useTransition();

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const input = inputRef.current;
      if (!input) return;

      if (e.key === "Esc") {
        input.blur();
      }
    },
    [],
  );

  const handleSelectItem = useCallback(
    (item: {
      id: number;
      itemId: number;
      shortname: string;
      name: string;
      category: string;
      imagePath: string;
    }) => {
      if (items && items.length >= 5) {
        return toast.warning("Item limit reached", {
          description: "You can only select up to 5 items at a time.",
        });
      }

      setInputValue("");
      setSearchParams(
        { items: [...(items || []), item.name] },
        {
          startTransition,
          shallow: false,
          limitUrlUpdates: {
            method: "throttle",
            timeMs: 500,
          },
        },
      ).then(() => {
        setOpen(false);
      });
    },
    [items, setSearchParams],
  );

  if (!itemsData || !itemsData.data) return null;

  const selectables = itemsData.data.filter(
    (item) => !items?.includes(item.name),
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <SidebarMenuButton
          variant='outline'
          className={cn(
            "w-full justify-start border text-muted-foreground dark:border-input",
            className,
          )}
          disabled={isLoading}
          {...props}
        >
          <CirclePlusIcon className='size-4 shrink-0' /> Select items...
        </SidebarMenuButton>
      </PopoverTrigger>

      <PopoverContent
        className='p-0'
        style={{
          width: "var(--radix-popover-trigger-width)",
        }}
      >
        <Command onKeyDown={handleKeyDown} className='overflow-visible'>
          <CommandInput
            ref={inputRef}
            value={inputValue}
            onValueChange={setInputValue}
            onBlur={() => setOpen(false)}
            onFocus={() => setOpen(true)}
            placeholder='Select items...'
            disabled={isLoading}
          />

          <CommandList>
            {open && selectables.length > 0 ? (
              <CommandGroup className='h-full overflow-auto'>
                {selectables.map((item) => (
                  <CommandItem
                    key={item.itemId}
                    className='cursor-pointer'
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onSelect={() => handleSelectItem(item)}
                    disabled={isLoading}
                  >
                    <Item item={item} />
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : (
              <CommandEmpty>No items found.</CommandEmpty>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function Item({
  item,
  className,
  truncate = false,
}: {
  item: typeof items.$inferSelect;
  truncate?: boolean;
} & React.ComponentProps<"div">) {
  return (
    <div className='flex items-center gap-2'>
      <div className={cn("relative h-6 w-6", className)}>
        <Image
          src={getR2ImageUrl(item.imagePath + ".webp", "tiny")}
          alt={item.name}
          width={24}
          height={24}
          unoptimized
          className='rounded-sm object-contain'
        />
      </div>
      <span
        className={cn(truncate && "line-clamp-1 text-sm/7 overflow-ellipsis")}
      >
        {item.name}
      </span>
    </div>
  );
}
