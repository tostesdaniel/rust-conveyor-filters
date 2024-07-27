import { Typography } from "@/components/ui/typography";
import { FilterGrid } from "@/components/filters/filter-grid";

export default function FiltersPage() {
  return (
    <>
      <Typography variant='h1'>Browse Filters</Typography>
      <FilterGrid />
    </>
  );
}
