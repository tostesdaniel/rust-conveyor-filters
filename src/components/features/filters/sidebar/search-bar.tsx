"use client";

import { useTransition } from "react";
import { InfoIcon, SearchIcon } from "lucide-react";

import { useSearchParams } from "@/hooks/useSearchParams";
import { Label } from "@/components/ui/label";
import { SidebarInput } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function SearchBar() {
  const [isLoading, startTransition] = useTransition();
  const [{ search }, setSearchParams] = useSearchParams({
    limitUrlUpdates: {
      method: "debounce",
      timeMs: 1000,
    },
    startTransition,
    shallow: false,
  });

  return (
    <Tooltip>
      <div className='flex items-center gap-2'>
        <div className='relative'>
          <SearchIcon className='absolute top-1/2 left-2 size-4 -translate-y-1/2 text-muted-foreground' />
          <Label htmlFor='search-bar' className='sr-only'>
            Search filters
          </Label>
          <SidebarInput
            id='search-bar'
            placeholder='Search filters...'
            className='px-7'
            value={search}
            onChange={(e) => setSearchParams({ search: e.target.value })}
            disabled={isLoading}
          />
          <TooltipTrigger className='absolute top-1/2 right-2 size-4 -translate-y-1/2'>
            <InfoIcon className='size-4 text-muted-foreground' />
          </TooltipTrigger>
          <TooltipContent sideOffset={4} side='right'>
            <p>
              Search for filters by name, description, item names or category
              names.
            </p>
          </TooltipContent>
        </div>
      </div>
    </Tooltip>
  );
}
