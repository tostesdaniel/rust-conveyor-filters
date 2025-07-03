import { Suspense } from "react";

import { CategorySelection } from "@/components/filters/sidebar/category-selection";
import { ClearFiltersButton } from "@/components/filters/sidebar/clear-filters-button";
import { ItemsSelection } from "@/components/filters/sidebar/items-selection";

export function FiltersSidebarContent() {
  return (
    <Suspense>
      <ItemsSelection />
      <CategorySelection />
      <ClearFiltersButton />
    </Suspense>
  );
}
