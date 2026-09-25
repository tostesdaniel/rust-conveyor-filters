import { trackEvent } from "@/utils/rybbit";
import { useUser } from "@clerk/nextjs";
import { Share } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ShareButton({ filterId }: { filterId: number }) {
  const { user } = useUser();

  const handleShare = async () => {
    const searchParams = new URLSearchParams({
      share: filterId.toString(),
    });

    if (user?.username) {
      searchParams.set("by", user.username);
    }

    const url = `${window.location.origin}/filters?${searchParams.toString()}`;

    try {
      await navigator.clipboard.writeText(url);
      toast.success("Share link copied to clipboard");
      trackEvent("filter_share_link_copied", { filterId });
    } catch (err) {
      toast.error("Failed to copy share link");
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='hover:bg-transparent hover:text-muted-foreground'
            onClick={handleShare}
          />
        }
      >
        <Share />
      </TooltipTrigger>
      <TooltipContent>Share filter</TooltipContent>
    </Tooltip>
  );
}
