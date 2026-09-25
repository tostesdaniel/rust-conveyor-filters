"use client";

import React, { useCallback, useState, useTransition } from "react";
import { searchItems } from "@/utils/item-search";
import { trackEvent } from "@/utils/rybbit";
import { CirclePlusIcon, XIcon } from "lucide-react";
import { throttle } from "nuqs";
import { toast } from "sonner";

import { useGetItems } from "@/hooks/use-get-items";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useSearchParams } from "@/hooks/useSearchParams";
import { cn } from "@/lib/utils";
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
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
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
import { navSheetDrawerLayer } from "@/components/features/filters/sidebar/nav-sheet-drawer";
import { ItemIcon } from "@/components/shared/item-icon";

export function ItemsSelection() {
  const { data: itemsData, isLoading: itemsLoading } = useGetItems();
  const [{ items }, setSearchParams] = useSearchParams();
  const [isLoading, startTransition] = useTransition();

  const handleRemoveItem = useCallback(
    (item: string) => {
      trackEvent("browse_item_removed", { item });
      const newItems =
        items && items.length > 1 ? items.filter((i) => i !== item) : null;
      setSearchParams(
        { items: newItems },
        {
          startTransition,
          shallow: false,
          limitUrlUpdates: throttle(500),
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

        {itemsLoading || !itemsData ? (
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
                const foundItem = itemsData?.find((i) => i.name === item);
                return foundItem ? (
                  <SidebarMenuSubItem key={item}>
                    <SidebarMenuSubButton
                      className='h-8'
                      render={
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
                        />
                      }
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
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const { data: itemsData } = useGetItems();
  const [{ items }, setSearchParams] = useSearchParams();
  const [isLoading, startTransition] = useTransition();
  const isDesktop = useMediaQuery("(min-width: 768px)");

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

      trackEvent("browse_item_added", { item: item.name });
      setInputValue("");
      setSearchParams(
        { items: [...(items || []), item.name] },
        {
          startTransition,
          shallow: false,
          limitUrlUpdates: throttle(500),
        },
      ).then(() => {
        setOpen(false);
      });
    },
    [items, setSearchParams],
  );

  if (!itemsData) return null;

  const selectables = searchItems(
    itemsData.filter((item) => !items?.includes(item.name)),
    inputValue,
  );

  const trigger = (
    <SidebarMenuButton
      variant='outline'
      className={cn(
        "w-full justify-start border text-muted-foreground dark:border-input",
        className,
      )}
      disabled={isLoading}
      {...props}
    />
  );

  const list = (
    <Command shouldFilter={false} className='overflow-visible'>
      <CommandInput
        value={inputValue}
        onValueChange={setInputValue}
        placeholder='Select items...'
        disabled={isLoading}
      />

      <CommandList>
        {selectables.length > 0 ? (
          <CommandGroup className='h-full overflow-auto'>
            {selectables.map(({ item }) => (
              <CommandItem
                key={item.itemId}
                className='cursor-pointer'
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
  );

  if (!isDesktop) {
    return (
      <Drawer open={open} onOpenChange={setOpen} showSwipeHandle>
        <DrawerTrigger render={trigger}>
          <CirclePlusIcon className='size-4 shrink-0' /> Select items…
        </DrawerTrigger>

        <DrawerContent className='pb-4' {...navSheetDrawerLayer}>
          <DrawerHeader className='sr-only'>
            <DrawerTitle>Select items</DrawerTitle>
            <DrawerDescription>
              Search for items to filter the results by. Up to 5 at a time.
            </DrawerDescription>
          </DrawerHeader>
          {list}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={trigger}>
        <CirclePlusIcon className='size-4 shrink-0' /> Select items…
      </PopoverTrigger>

      <PopoverContent
        className='p-0'
        style={{
          width: "var(--anchor-width)",
        }}
      >
        {list}
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
        <ItemIcon
          imagePath={item.imagePath}
          version={item.iconVersion}
          size='tiny'
          alt={item.name}
          width={24}
          height={24}
          unoptimized
          className='rounded-sm object-contain'
        />
      </div>
      <span className={cn(truncate && "line-clamp-1 text-sm/7 text-ellipsis")}>
        {item.name}
      </span>
    </div>
  );
}
