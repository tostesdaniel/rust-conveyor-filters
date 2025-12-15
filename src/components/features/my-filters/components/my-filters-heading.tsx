"use client";

import Link from "next/link";
import { trackEvent } from "@/utils/rybbit";
import { PlusIcon } from "lucide-react";

import { useGetUserCategories } from "@/hooks/use-get-user-categories";
import { useGetUserFilters } from "@/hooks/use-get-user-filters";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/shared/typography";

export function MyFiltersHeading() {
  const { data: filters } = useGetUserFilters();
  const { data: categories } = useGetUserCategories();

  if (!filters?.length && !categories?.length) {
    return <Typography variant='h1'>My Filters</Typography>;
  }

  return (
    <div className='md:flex md:items-center md:justify-between'>
      <div className='min-w-0 flex-1'>
        <Typography variant='h1'>My Filters</Typography>
      </div>
      <div className='mt-4 flex md:mt-0 md:ml-4'>
        <Button
          type='button'
          asChild
          onClick={() => {
            trackEvent("new_filter_clicked");
          }}
        >
          <Link href='/my-filters/new-filter'>
            <PlusIcon aria-hidden='true' />
            New Filter
          </Link>
        </Button>
      </div>
    </div>
  );
}
