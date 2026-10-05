import type { OutputContainerDTO } from "@/types/filter";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ItemIcon } from "@/components/shared/item-icon";

// Median transparent left inset of container icons, as width fraction.
const LEFT_INSET = 0.146;

export function OutputContainerIcon({
  container,
  size = 20,
}: {
  container: OutputContainerDTO | null;
  size?: number;
}) {
  if (!container) return null;
  const label = `Output container: ${container.name}`;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            tabIndex={0}
            style={{ marginLeft: -Math.round(size * LEFT_INSET) }}
            className='inline-flex shrink-0 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring'
          />
        }
      >
        <ItemIcon
          imagePath={container.imagePath}
          version={container.iconVersion}
          size={size > 24 ? "small" : "tiny"}
          alt={label}
          width={size}
          height={size}
          unoptimized
          style={{ width: size, height: size }}
          className='object-contain'
        />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
