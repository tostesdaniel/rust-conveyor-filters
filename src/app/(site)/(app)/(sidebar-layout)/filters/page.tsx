import { Suspense } from "react";
import type { Metadata } from "next";

import { FilterGrid } from "@/components/features/filters/components/filter-grid";
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
  alternates: {
    canonical: "/filters",
  },
};

export default function FiltersPage() {
  return (
    <FilterShareProvider>
      <Suspense>
        <FilterGrid />
      </Suspense>
    </FilterShareProvider>
  );
}
