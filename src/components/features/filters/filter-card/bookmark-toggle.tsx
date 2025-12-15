"use client";

import { useMemo } from "react";
import { api } from "@/trpc/react";
import { trackEvent } from "@/utils/rybbit";
import { useUser } from "@clerk/nextjs";
import { BookmarkIcon, Loader2Icon } from "lucide-react";
import { Toggle as TogglePrimitive } from "radix-ui";
import { toast } from "sonner";

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

  const { data: bookmarkedFilters, isLoading } = api.bookmark.getAll.useQuery(
    undefined,
    {
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

  const utils = api.useUtils();
  const mutation = api.bookmark.toggle.useMutation({
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
      if (err.data?.code === "UNAUTHORIZED") {
        toast.error("You must be signed in to bookmark a filter");
      } else {
        toast.error("An error occurred while bookmarking the filter");
      }
    },
    onSettled: () => {
      utils.bookmark.getAll.invalidate();
    },
  });

  return (
    <Toggle
      aria-label='Bookmark filter'
      className='group -my-3 hover:bg-transparent data-[state=on]:bg-transparent data-[state=on]:hover:text-muted-foreground'
      onPressedChange={() => mutation.mutate({ filterId: filterId })}
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
