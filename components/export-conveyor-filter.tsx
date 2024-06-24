"use client";

import { toast } from "sonner";

import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { exportConveyorFilter } from "@/lib/export-conveyor-filter";

import { DropdownMenuItem } from "./ui/dropdown-menu";

export function ExportConveyorFilter({ filter }: any) {
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

  return (
    <DropdownMenuItem onSelect={handleCopy(exportConveyorFilter(filter))}>
      Export
    </DropdownMenuItem>
  );
}
