"use client";

import { toast } from "sonner";

import { FilterItemWithItemInfo } from "@/types/filter";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { exportConveyorFilter } from "@/lib/export-conveyor-filter";

import { Button } from "./ui/button";
import { DropdownMenuItem } from "./ui/dropdown-menu";

interface ExportConveyorFilterProps {
  type: "button" | "dropdown";
  filter: FilterItemWithItemInfo[];
}

export function ExportConveyorFilter({
  type,
  filter,
}: ExportConveyorFilterProps) {
  const [_copiedText, copy] = useCopyToClipboard();

  const handleCopy = (text: string) => () => {
    copy(text)
      .then(() => {
        toast.success("Exported to clipboard");
      })
      .catch((error) => {
        toast.error(`Failed to export: ${error.message}`);
      });
  };

  return type === "button" ? (
    <Button
      type='button'
      onClick={() => handleCopy(exportConveyorFilter(filter))}
      size='sm'
    >
      Export
    </Button>
  ) : (
    <DropdownMenuItem onSelect={handleCopy(exportConveyorFilter(filter))}>
      Export
    </DropdownMenuItem>
  );
}
