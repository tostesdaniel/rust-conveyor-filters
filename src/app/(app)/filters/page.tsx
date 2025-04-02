import type { Metadata } from "next";

import { Typography } from "@/components/ui/typography";
import { FilterGrid } from "@/components/filters/filter-grid";
import { FilterShareProvider } from "@/providers/filter-share-provider";

export const metadata: Metadata = {
  title: "Browse Filters",
  description:
    "Explore and discover ready-to-use Rust conveyor filters for your base automation. Save time with pre-configured item sorting and resource management setups.",
  robots: {
    index: true,
    follow: true,
    nocache: true,
  },
};

export default function FiltersPage() {
  return (
    <FilterShareProvider>
      <Typography variant='h1'>Browse Filters</Typography>
      <FilterGrid />
    </FilterShareProvider>
  );
}
