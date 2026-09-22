import type { Metadata } from "next";
import { api, HydrateClient } from "@/trpc/server";

import { MyFiltersHeading } from "@/components/features/my-filters/components/my-filters-heading";
import { MyFiltersTabs } from "@/components/features/my-filters/components/my-filters-tabs";

export const metadata: Metadata = {
  title: "My Filters",
  description: "View and manage your conveyor filters.",
};

export default async function MyFiltersPage() {
  await Promise.all([
    api.bookmark.getAll.prefetch(),
    api.filter.getByCategory.prefetch({ categoryId: null }),
    api.category.getAll.prefetch(),
    api.category.getHierarchy.prefetch(),
    api.shareToken.get.prefetch(),
    api.sharedFilter.getAll.prefetch(),
  ]);

  return (
    <>
      <HydrateClient>
        <MyFiltersHeading />
        <MyFiltersTabs />
      </HydrateClient>
    </>
  );
}
