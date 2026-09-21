import Link from "next/link";
import { GitForkIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Entry point to the lazy Remix flow: links to the new-filter editor pre-filled
 * from this public source. No fork is persisted until the user saves.
 *
 * `iconOnly` is used to render a tooltip'd icon button -> used in the card's
 * header, alongside Share and Bookmark buttons.
 */
export function RemixButton({
  filterId,
  className,
  iconOnly = false,
}: {
  filterId: number;
  className?: string;
  iconOnly?: boolean;
}) {
  const href = `/my-filters/new-filter?remixOf=${filterId}`;

  if (iconOnly) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <Link
              href={href}
              aria-label='Remix this filter'
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "hover:bg-transparent hover:text-muted-foreground",
                className,
              )}
            />
          }
        >
          <GitForkIcon />
        </TooltipTrigger>
        <TooltipContent>Remix this filter</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Link
      href={href}
      className={cn(buttonVariants(), className)}
    >
      <GitForkIcon />
      Remix
    </Link>
  );
}
