"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { filterSortOptions } from "@/types/filter-sorting";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function FilterSortTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSort = searchParams.get("sort") || "popular";

  const handleSortChange = (value: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams);
      params.set("sort", value);
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <Tabs value={currentSort} onValueChange={handleSortChange}>
      <TabsList>
        {filterSortOptions.map((option) => (
          <TabsTrigger
            key={option.value}
            value={option.value}
            disabled={isPending}
          >
            <option.icon className='hidden sm:block' />
            {option.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
