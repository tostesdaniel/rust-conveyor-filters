"use client";

import { useTransition } from "react";
import { trackEvent } from "@/utils/rybbit";
import type { inferParserType } from "nuqs";

import { filterSortOptions } from "@/types/filter-sorting";
import { searchParams as searchParamsDef } from "@/config/search-params";
import { useSearchParams } from "@/hooks/useSearchParams";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function FilterSortTabs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoading, startTransition] = useTransition();

  const handleTabChange = (value: string) => {
    trackEvent("filter_sort_changed", { sort: value });
    setSearchParams(
      { sort: value as inferParserType<typeof searchParamsDef.sort> },
      { startTransition, shallow: false, scroll: true },
    );
  };

  return (
    <Tabs value={searchParams.sort} onValueChange={handleTabChange}>
      <TabsList>
        {filterSortOptions.map((option) => (
          <TabsTrigger
            key={option.value}
            value={option.value}
            disabled={isLoading}
          >
            <option.icon className='hidden min-[412px]:block' />
            {option.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
