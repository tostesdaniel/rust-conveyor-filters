import type { Metadata } from "next";

import { Typography } from "@/components/ui/typography";
import { FilterGrid } from "@/components/filters/filter-grid";

export const metadata: Metadata = {
  title: "Browse Filters",
  description: "Browse through the available conveyor filters.",
  robots: {
    index: true,
    follow: true,
    nocache: true,
  },
};

export default function FiltersPage() {
  return (
    <>
      <Typography variant='h1'>Browse Filters</Typography>
      <FilterGrid />
    </>
  );
}
