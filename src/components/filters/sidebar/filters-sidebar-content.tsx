import { CategorySelection } from "@/components/filters/sidebar/category-selection";
import { ItemsSelection } from "@/components/filters/sidebar/items-selection";

export function FiltersSidebarContent() {
  return (
    <>
      <ItemsSelection />
      <CategorySelection />
    </>
  );
}
