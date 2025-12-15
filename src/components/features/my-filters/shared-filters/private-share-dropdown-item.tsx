import { trackEvent } from "@/utils/rybbit";
import { Share2Icon } from "lucide-react";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

interface PrivateShareDropdownItemProps {
  filterId: number;
  setIsDialogOpen: (open: boolean) => void;
}

export function PrivateShareDropdownItem({
  filterId,
  setIsDialogOpen,
}: PrivateShareDropdownItemProps) {
  return (
    <DropdownMenuItem
      onClick={() => {
        trackEvent("my_filter_share_opened", { filterId });
        setIsDialogOpen(true);
      }}
    >
      <Share2Icon className='h-4 w-4' />
      Share
    </DropdownMenuItem>
  );
}
