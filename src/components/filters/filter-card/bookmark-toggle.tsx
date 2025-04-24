"use client";

import { useEffect, useState } from "react";
import { api } from "@/trpc/client";
import { useUser } from "@clerk/nextjs";
import type { ToggleProps } from "@radix-ui/react-toggle";
import { BookmarkIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { Toggle } from "@/components/ui/toggle";

interface BookmarkToggleProps extends ToggleProps {
  filterId: number;
  initialBookmarked?: boolean;
}

export function BookmarkToggle({
  filterId,
  initialBookmarked = false,
  ...props
}: BookmarkToggleProps) {
  const { isLoaded, isSignedIn } = useUser();
  const [isBookmarked, setIsBookmarked] = useState<boolean>(initialBookmarked);

  const utils = api.useUtils();
  const { data: bookmarkedData, isLoading } =
    api.bookmarks.getBookmarkedStatus.useQuery(
      { filterId },
      { enabled: isLoaded && isSignedIn && !initialBookmarked },
    );

  const mutation = api.bookmarks.bookmark.useMutation({
    onSuccess: (data) => {
      setIsBookmarked(data.bookmarked);
      toast.success(
        data.bookmarked ? "Filter bookmarked" : "Filter unbookmarked",
      );
    },
    onError: (error) => {
      if (error.data?.code === "UNAUTHORIZED") {
        toast.error("You must be signed in to bookmark a filter");
      } else {
        toast.error("An error occurred while bookmarking the filter");
      }
    },
    onSettled: () => {
      utils.bookmarks.getBookmarkedStatus.invalidate();
      utils.bookmarks.getBookmarkedFilters.invalidate();
    },
  });

  useEffect(() => {
    if (bookmarkedData) {
      setIsBookmarked(bookmarkedData.bookmarked);
    }
  }, [bookmarkedData]);

  useEffect(() => {
    if (initialBookmarked) {
      setIsBookmarked(true);
    }
  }, [initialBookmarked]);

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
