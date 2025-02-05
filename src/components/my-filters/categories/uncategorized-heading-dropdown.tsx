"use client";

import { useState } from "react";
import { EllipsisIcon, Share } from "lucide-react";

import { useGetUserFiltersByCategory } from "@/hooks/use-get-user-filters-by-category";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { ShareWithUserDialog } from "../shared-filters/share-with-user-dialog";

interface UncategorizedHeadingDropdownProps {
  categoryId: number | null;
}

export function UncategorizedHeadingDropdown({
  categoryId,
}: UncategorizedHeadingDropdownProps) {
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const { data: uncategorizedFilters = [] } = useGetUserFiltersByCategory(null);

  const hasFilters = uncategorizedFilters.length > 0;

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button type='button' variant='ghost' size='icon' className='h-8 w-8'>
            <EllipsisIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            onClick={() => setIsShareDialogOpen(true)}
            disabled={!hasFilters}
          >
            <Share />
            Share all filters
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ShareWithUserDialog
        categoryId={categoryId}
        open={isShareDialogOpen}
        onOpenChange={setIsShareDialogOpen}
        setIsDialogOpen={setIsShareDialogOpen}
      />
    </>
  );
}
