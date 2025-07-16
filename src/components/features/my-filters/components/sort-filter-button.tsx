import { ArrowDownUpIcon } from "lucide-react";

import { filterSortTypes, type FilterSortType } from "@/hooks/use-filter-sort";

import { Button } from "../../../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../../ui/dropdown-menu";

interface SortFilterButtonProps {
  value: FilterSortType["value"];
  onValueChange: (value: FilterSortType["value"]) => void;
}

export function SortFilterButton({
  value,
  onValueChange,
}: SortFilterButtonProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type='button' variant='ghost' size='icon' className='h-8 w-8'>
          <ArrowDownUpIcon className='size-4' />
          <span className='sr-only'>Sort filters</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Sort by</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={onValueChange as (value: string) => void}
        >
          {filterSortTypes.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              <option.icon className='mr-2 size-4' />
              <span>{option.label}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
