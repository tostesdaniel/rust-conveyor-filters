"use client";

import { useEffect } from "react";
import Link from "next/link";
import { HeartHandshake, Sparkles } from "lucide-react";

import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DonateUpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShown: () => void;
  onDismiss: () => void;
}

export function DonateUpgradeModal({
  open,
  onOpenChange,
  onShown,
  onDismiss,
}: DonateUpgradeModalProps) {
  useEffect(() => {
    if (open) onShown();
  }, [open, onShown]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onDismiss();
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Sparkles className='size-5 text-primary' />
            Enjoying {siteConfig.name}?
          </DialogTitle>
          <DialogDescription>
            You&apos;ve been making the most of the tool. Go ad-free, get the
            Supporter badge, and keep development moving. Yearly saves ~17%.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className='flex-col gap-2 sm:flex-col sm:space-x-0'>
          <Button asChild className='w-full' onClick={onDismiss}>
            <Link href='/donate?plan=yearly'>
              <HeartHandshake />
              Subscribe yearly ($30)
            </Link>
          </Button>
          <Button
            asChild
            variant='secondary'
            className='w-full'
            onClick={onDismiss}
          >
            <Link href='/donate?plan=monthly'>Monthly ($3/mo)</Link>
          </Button>
          <div className='flex pt-1 text-sm'>
            <button
              type='button'
              onClick={onDismiss}
              className='text-muted-foreground hover:text-foreground'
            >
              Maybe later
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
