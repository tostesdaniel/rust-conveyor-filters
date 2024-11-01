import { ArrowUpCircle, Clock, Download, Flame } from "lucide-react";

export type FilterSortOption = {
  value: "popular" | "new" | "updated" | "mostUsed";
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

export const filterSortOptions: FilterSortOption[] = [
  {
    value: "popular",
    label: "Popular",
    icon: Flame,
  },
  {
    value: "new",
    label: "New",
    icon: Clock,
  },
  {
    value: "updated",
    label: "Updated",
    icon: ArrowUpCircle,
  },
  {
    value: "mostUsed",
    label: "Most Used",
    icon: Download,
  },
] as const;
