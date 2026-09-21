import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FilterSettingsTooltipProps {
  children: React.ReactElement;
  tooltipText: string;
}

export function FilterSettingsTooltip({
  children,
  tooltipText,
}: FilterSettingsTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger render={children} />
        <TooltipContent>
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
