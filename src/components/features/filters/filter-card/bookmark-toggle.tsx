"use client";

import { useMemo } from "react";
import { getBookmarkedFilters } from "@/services/queries";
import { trackEvent } from "@/utils/rybbit";
import { useUser } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";
import { BookmarkIcon, Loader2Icon } from "lucide-react";
import { Toggle as TogglePrimitive } from "radix-ui";
import { toast } from "sonner";

import { bookmarkFilterAction } from "@/actions/bookmark-filter";
import {
  useServerActionMutation,
  useServerActionQuery,
} from "@/hooks/server-action-hooks";
import { Toggle } from "@/components/ui/toggle";

interface BookmarkToggleProps
  extends React.ComponentProps<typeof TogglePrimitive.Root> {
  filterId: number;
  initialBookmarked?: boolean;
}

export function BookmarkToggle({
  filterId,
  initialBookmarked = false,
  ...props
}: BookmarkToggleProps) {
  const { isLoaded, isSignedIn } = useUser();
  const queryClient = useQueryClient();

  const { data: bookmarkedFilters, isLoading } = useServerActionQuery(
    getBookmarkedFilters,
    {
      input: undefined,
      queryKey: ["bookmarked-filters"],
      enabled: isLoaded && isSignedIn && !initialBookmarked,
    },
  );

  // Create a Set of bookmarked filter IDs for efficient lookup
  const bookmarkedFilterIds = useMemo(() => {
    if (!bookmarkedFilters) return new Set<number>();
    return new Set(bookmarkedFilters.map((bookmark) => bookmark.filterId));
  }, [bookmarkedFilters]);

  // Determine bookmark status: use initialBookmarked if provided, otherwise check the fetched list
  const isBookmarked = useMemo(() => {
    if (initialBookmarked) return true;
    if (!isLoaded || !isSignedIn) return false;
    return bookmarkedFilterIds.has(filterId);
  }, [initialBookmarked, isLoaded, isSignedIn, bookmarkedFilterIds, filterId]);

  const mutation = useServerActionMutation(bookmarkFilterAction, {
    onSuccess: (data) => {
      trackEvent("filter_bookmark_toggled", {
        filterId,
        bookmarked: data.bookmarked,
      });
      toast.success(
        data.bookmarked ? "Filter bookmarked" : "Filter unbookmarked",
      );
    },
    onError: (err) => {
      if (err.code === "NOT_AUTHORIZED") {
        toast.error("You must be signed in to bookmark a filter");
      } else {
        toast.error("An error occurred while bookmarking the filter");
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarked-filters"] });
    },
  });

  return (
    <Toggle
      aria-label='Bookmark filter'
      className='group -my-3 hover:bg-transparent data-[state=on]:bg-transparent data-[state=on]:hover:text-muted-foreground'
      onPressedChange={() => mutation.mutate({ filterId })}
      pressed={isBookmarked}
      {...props}
    >
      {isLoading ? (
        <Loader2Icon className='h-4 w-4 animate-spin' />
      ) : (
        <BookmarkIcon className='h-4 w-4 group-data-[state=on]:fill-current' />
      )}
    </Toggle>
  );
}
