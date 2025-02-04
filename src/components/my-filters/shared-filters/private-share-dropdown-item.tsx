import { Share2Icon } from "lucide-react";

import { DropdownMenuItem } from "../../ui/dropdown-menu";

interface PrivateShareDropdownItemProps {
  filterId: number;
  setIsDialogOpen: (open: boolean) => void;
}

export function PrivateShareDropdownItem({
  setIsDialogOpen,
}: PrivateShareDropdownItemProps) {
  return (
    <DropdownMenuItem onClick={() => setIsDialogOpen(true)}>
      <Share2Icon className='h-4 w-4' />
      Share
    </DropdownMenuItem>
  );
}
