"use client";

import { useEffect, useState } from "react";
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
import { getBookmarkedStatus } from "@/lib/queries";
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
  const [isBookmarked, setIsBookmarked] = useState<boolean>(initialBookmarked);
  const queryClient = useQueryClient();

  const { data: bookmarkedData, isLoading } = useServerActionQuery(
    getBookmarkedStatus,
    {
      input: { filterId },
      queryKey: ["bookmarked", filterId],
      enabled: isLoaded && isSignedIn && !initialBookmarked,
    },
  );

  const mutation = useServerActionMutation(bookmarkFilterAction, {
    onSuccess: (data) => {
      setIsBookmarked(data.bookmarked);
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
      queryClient.invalidateQueries({ queryKey: ["bookmarked", filterId] });
      queryClient.invalidateQueries({ queryKey: ["bookmarked-filters"] });
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
