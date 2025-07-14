"use client";

import { exportConveyorFilter } from "@/utils/export-conveyor-filter";
import { Copy } from "lucide-react";
import { toast } from "sonner";

import { type ConveyorFilterItem } from "@/types/filter";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { useLogFilterEvent } from "@/hooks/use-log-filter-event";
import { cn } from "@/lib/utils";

import { Button } from "./ui/button";
import { DropdownMenuItem } from "./ui/dropdown-menu";

interface ExportConveyorFilterProps {
  type: "button" | "dropdown" | "icon";
  filter: ConveyorFilterItem[];
  filterId?: number;
  log?: boolean;
  className?: string;
}

export function ExportConveyorFilter({
  type,
  filter,
  filterId,
  log = false,
  className,
}: ExportConveyorFilterProps) {
  const [_copiedText, copy] = useCopyToClipboard();
  const { logEvent } = useLogFilterEvent();

  if (log && !filterId) {
    throw new Error("Filter ID is required to log events");
  }

  const handleCopy = (text: string) => () => {
    copy(text)
      .then(async () => {
        toast.success("Exported to clipboard", {
          description: "Paste it while holding SHIFT key to import in game",
        });
        if (log && filterId) {
          await logEvent("export", filterId);
        }
      })
      .catch((error) => {
        toast.error(`Failed to export: ${error.message}`);
      });
  };

  const exportText = exportConveyorFilter(filter);

  return type === "button" ? (
    <Button
      type='button'
      onClick={handleCopy(exportText)}
      className={className}
    >
      <Copy />
      Export
    </Button>
  ) : type === "dropdown" ? (
    <DropdownMenuItem onSelect={handleCopy(exportText)} className={className}>
      <Copy />
      Export
    </DropdownMenuItem>
  ) : (
    <Button
      type='button'
      onClick={handleCopy(exportText)}
      variant='ghost'
      size='icon'
      className={cn(
        "h-4 w-4 hover:bg-transparent hover:text-muted-foreground",
        className,
      )}
    >
      <Copy />
    </Button>
  );
}
