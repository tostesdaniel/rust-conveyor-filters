"use client";

import { useTransition } from "react";
import type { inferParserType } from "nuqs";

import { filterSortOptions } from "@/types/filter-sorting";
import { useSearchParams } from "@/hooks/useSearchParams";
import { searchParams as searchParamsDef } from "@/lib/search-params";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function FilterSortTabs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoading, startTransition] = useTransition();

  const handleTabChange = (value: string) => {
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
            <option.icon className='hidden sm:block' />
            {option.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
