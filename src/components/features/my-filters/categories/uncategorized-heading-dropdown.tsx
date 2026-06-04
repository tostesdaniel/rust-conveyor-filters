"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import {
  ArrowDownToLine,
  ArrowUpToLine,
  EllipsisIcon,
  Share,
} from "lucide-react";

import { useGetUserFiltersByCategory } from "@/hooks/use-get-user-filters-by-category";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUpdatePreferences } from "@/components/features/my-filters/hooks/use-update-preferences";
import { ShareWithUserDialog } from "@/components/features/my-filters/shared-filters/share-with-user-dialog";

interface UncategorizedHeadingDropdownProps {
  categoryId: number | null;
}

export function UncategorizedHeadingDropdown({
  categoryId,
}: UncategorizedHeadingDropdownProps) {
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const { data: uncategorizedFilters = [] } = useGetUserFiltersByCategory(null);

  const hasFilters = uncategorizedFilters.length > 0;

  const preferencesQuery = api.userPreferences.get.useQuery();
  const updatePreferences = useUpdatePreferences();

  const currentPosition = preferencesQuery.data?.uncategorizedPosition ?? "top";
  const togglePosition = currentPosition === "top" ? "bottom" : "top";

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button type='button' variant='ghost' size='icon' className='size-8'>
            <EllipsisIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            onClick={() =>
              updatePreferences.mutate({
                uncategorizedPosition: togglePosition,
              })
            }
          >
            {togglePosition === "top" ? <ArrowUpToLine /> : <ArrowDownToLine />}
            Pin to {togglePosition}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
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
