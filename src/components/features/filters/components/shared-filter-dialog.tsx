"use client";

import { ShareIcon } from "lucide-react";

import type { PublicFilterListDTO } from "@/types/filter";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { FilterCard } from "@/components/features/filters/filter-card/filter-card";

interface SharedFilterDialogProps {
  filter: PublicFilterListDTO;
  sharedBy: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SharedFilterDialog({
  filter,
  sharedBy,
  open,
  onOpenChange,
}: SharedFilterDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl pb-0'>
        <DialogHeader>
          <DialogTitle className='text-foreground/90'>
            <span
              className={cn(
                "inline-block animate-wave",
                "motion-reduce:animate-none",
              )}
              aria-hidden='true'
              role='presentation'
            >
              👋
            </span>{" "}
            Hey! Someone wants you to see this filter
          </DialogTitle>
          <DialogDescription className='flex items-center gap-x-2'>
            <ShareIcon className='size-4' />
            {sharedBy ? `Shared by ${sharedBy}` : "Shared Filter"}
          </DialogDescription>
        </DialogHeader>
        <Separator />
        <div className='-mx-6 grid grid-cols-1'>
          <FilterCard
            filter={filter}
            className='max-w-none rounded-none border-0 sm:rounded-lg'
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
