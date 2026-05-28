"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { ArrowDownToLine, ArrowUpToLine, EllipsisIcon, Share } from "lucide-react";
import { toast } from "sonner";

import { useGetUserFiltersByCategory } from "@/hooks/use-get-user-filters-by-category";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

  const utils = api.useUtils();
  const preferencesQuery = api.userPreferences.get.useQuery();
  const updatePreferences = api.userPreferences.update.useMutation({
    onMutate: async ({ uncategorizedPosition }) => {
      await utils.userPreferences.get.cancel();
      const previous = utils.userPreferences.get.getData();
      utils.userPreferences.get.setData(undefined, (old) => ({
        userId: old?.userId ?? "",
        uncategorizedPosition,
      }));
      return { previous };
    },
    onError: (err, _, context) => {
      if (context?.previous) {
        utils.userPreferences.get.setData(undefined, context.previous);
      }
      toast.error(err.message || "Failed to update preference");
    },
    onSettled: () => {
      utils.userPreferences.get.invalidate();
    },
  });

  const currentPosition = preferencesQuery.data?.uncategorizedPosition ?? "top";
  const togglePosition = currentPosition === "top" ? "bottom" : "top";

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
            onClick={() =>
              updatePreferences.mutate({
                uncategorizedPosition: togglePosition,
              })
            }
          >
            {togglePosition === "top" ? (
              <ArrowUpToLine />
            ) : (
              <ArrowDownToLine />
            )}
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
