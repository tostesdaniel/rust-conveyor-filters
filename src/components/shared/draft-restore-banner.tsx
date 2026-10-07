"use client";

import { formatDistanceToNow } from "date-fns";
import { HistoryIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export function DraftRestoreBanner({
  savedAt,
  onRestore,
  onDiscard,
}: {
  savedAt: number;
  onRestore: () => void;
  onDiscard: () => void;
}) {
  return (
    <div
      role='status'
      className='flex flex-col gap-3 rounded-md border border-border bg-muted/40 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between'
    >
      <div className='flex items-center gap-x-2 text-muted-foreground'>
        <HistoryIcon className='size-4 shrink-0' aria-hidden />
        <p>
          You have unsaved changes from{" "}
          <span className='font-medium text-foreground'>
            {formatDistanceToNow(savedAt, { addSuffix: true })}
          </span>
          .
        </p>
      </div>
      <div className='flex shrink-0 gap-x-2'>
        <Button type='button' size='sm' variant='ghost' onClick={onDiscard}>
          Discard
        </Button>
        <Button type='button' size='sm' onClick={onRestore}>
          Restore
        </Button>
      </div>
    </div>
  );
}
