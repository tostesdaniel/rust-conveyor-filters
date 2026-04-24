import { Suspense } from "react";

import { CategorySelection } from "@/components/features/filters/sidebar/category-selection";
import { ClearFiltersButton } from "@/components/features/filters/sidebar/clear-filters-button";
import { ItemsSelection } from "@/components/features/filters/sidebar/items-selection";
import { TagSelection } from "@/components/features/filters/sidebar/tag-selection";

export function FiltersSidebarContent() {
  return (
    <Suspense>
      <TagSelection />
      <ItemsSelection />
      <CategorySelection />
      <ClearFiltersButton />
    </Suspense>
  );
}
