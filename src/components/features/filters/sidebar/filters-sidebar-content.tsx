import { Suspense } from "react";

import { CategorySelection } from "@/components/features/filters/sidebar/category-selection";
import { ClearFiltersButton } from "@/components/features/filters/sidebar/clear-filters-button";
import { ItemsSelection } from "@/components/features/filters/sidebar/items-selection";

export function FiltersSidebarContent() {
  return (
    <Suspense>
      <ItemsSelection />
      <CategorySelection />
      <ClearFiltersButton />
    </Suspense>
  );
}
