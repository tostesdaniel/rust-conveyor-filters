"use client";

import { PlusIcon } from "lucide-react";

import { useGetUserCategories } from "@/hooks/use-get-user-categories";
import { useGetUserFilters } from "@/hooks/use-get-user-filters";
import { HeadingWithAction } from "@/components/shared/heading-with-action";
import { Typography } from "@/components/shared/typography";

export function MyFiltersHeading() {
  const { data: filters } = useGetUserFilters();
  const { data: categories } = useGetUserCategories();

  if (!filters?.length && !categories?.length) {
    return <Typography variant='h1'>My Filters</Typography>;
  }

  return (
    <HeadingWithAction
      buttonLabel='New Filter'
      label='My Filters'
      redirectUrl='/my-filters/new-filter'
      variant='h1'
      ActionIcon={PlusIcon}
    />
  );
}
