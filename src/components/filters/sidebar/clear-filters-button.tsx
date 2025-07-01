"use client";

import { useTransition } from "react";
import { X } from "lucide-react";

import { useSearchParams } from "@/hooks/useSearchParams";
import { Button } from "@/components/ui/button";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function ClearFiltersButton() {
  const [_, setSearchParams] = useSearchParams();
  const [isLoading, startTransition] = useTransition();

  const handleClearFilters = () => {
    setSearchParams(null, {
      shallow: false,
      startTransition,
      scroll: true,
    });
  };

  return (
    <SidebarGroup>
      <SidebarMenu>
        <SidebarMenuItem className='px-2'>
          <Button
            size='sm'
            className='w-full'
            onClick={handleClearFilters}
            disabled={isLoading}
          >
            <X />
            Clear Filters
          </Button>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
