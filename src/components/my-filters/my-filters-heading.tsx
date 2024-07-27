"use client";

import { PlusIcon } from "lucide-react";

import { useGetUserFilters } from "@/hooks/use-get-user-filters";
import { HeadingWithAction } from "@/components/ui/heading-with-action";
import { Typography } from "@/components/ui/typography";

export function MyFiltersHeading() {
  const { data: filters } = useGetUserFilters();

  if (!filters) {
    <Typography variant='h1'>My Filters</Typography>;
    return;
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
