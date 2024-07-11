"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";

import { type ConveyorFilterItem } from "@/types/filter";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { exportConveyorFilter } from "@/lib/export-conveyor-filter";

import { Button } from "./ui/button";
import { DropdownMenuItem } from "./ui/dropdown-menu";

interface ExportConveyorFilterProps {
  type: "button" | "dropdown";
  filter: ConveyorFilterItem[];
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

  const exportText = exportConveyorFilter(filter);

  return type === "button" ? (
    <Button type='button' onClick={handleCopy(exportText)} size='sm'>
      <Copy className='mr-2 h-4 w-4' />
      Export
    </Button>
  ) : (
    <DropdownMenuItem onSelect={handleCopy(exportText)}>
      <Copy className='mr-2 h-4 w-4' />
      Export
    </DropdownMenuItem>
  );
}
