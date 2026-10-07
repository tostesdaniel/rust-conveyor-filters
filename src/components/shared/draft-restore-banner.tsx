"use client";

import { formatDistanceToNow } from "date-fns";
import { HistoryIcon } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { EASE_OUT_STRONG } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function DraftRestoreBanner({
  savedAt,
  onRestore,
  onDiscard,
  stale = false,
  className,
}: {
  savedAt: number;
  stale?: boolean;
  onRestore: () => void;
  onDiscard: () => void;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const collapsed = reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 };

  return (
    <motion.div
      initial={collapsed}
      animate={{ height: "auto", opacity: 1 }}
      exit={{
        ...collapsed,
        transition: { duration: 0.15, ease: EASE_OUT_STRONG },
      }}
      transition={{ duration: 0.22, ease: EASE_OUT_STRONG }}
      className={cn("overflow-hidden", className)}
    >
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
            {stale &&
              " This filter was saved since then, so restoring will undo those changes."}
          </p>
        </div>
        <div className='flex shrink-0 gap-x-2'>
          <Button
            type='button'
            size='sm'
            variant={stale ? "default" : "ghost"}
            onClick={onDiscard}
          >
            Discard
          </Button>
          <Button
            type='button'
            size='sm'
            variant={stale ? "ghost" : "default"}
            onClick={onRestore}
          >
            {stale ? "Restore anyway" : "Restore"}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
