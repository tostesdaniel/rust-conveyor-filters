"use client";

import { useEffect } from "react";
import Link from "next/link";
import { HeartHandshake } from "lucide-react";
import { useMediaQuery } from "usehooks-ts";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Banner,
  BannerDescription,
  BannerDismiss,
} from "@/components/shared/banner";

interface DonateBannerProps {
  open: boolean;
  onShown: () => void;
  onDismiss: () => void;
}

export function DonateBannerDialog({
  open,
  onShown,
  onDismiss,
}: DonateBannerProps) {
  const isDesktop = useMediaQuery("(min-width: 1024px)", {
    initializeWithValue: false,
  });

  useEffect(() => {
    if (open) onShown();
  }, [open, onShown]);

  if (!open) return null;

  if (isDesktop) {
    return (
      <div className='pointer-events-none fixed inset-x-0 bottom-0 z-50 sm:flex sm:justify-center sm:px-6 sm:pb-5 lg:px-8'>
        <Banner className='pointer-events-auto flex-col border-b bg-accent sm:flex-row sm:items-center sm:rounded-xl sm:before:flex-1'>
          <BannerDescription className='flex items-center gap-2 text-sm/6'>
            <span className='font-semibold'>
              Browse ad-free for $3/mo and support the project
            </span>
            <Button asChild size='sm' variant='link' className='ml-2'>
              <Link href='/donate'>Subscribe</Link>
            </Button>
          </BannerDescription>
          <BannerDismiss onClick={onDismiss} />
        </Banner>
      </div>
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onDismiss();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Go Ad-Free</DialogTitle>
          <DialogDescription>
            Subscribe for $3/mo to remove ads and get a Supporter badge. Every
            subscription helps keep the site running. Discord Nitro Boosters
            enjoy ad-free browsing too.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button type='button' variant='secondary' onClick={onDismiss}>
              Maybe later
            </Button>
          </DialogClose>
          <Button asChild onClick={onDismiss}>
            <Link href='/donate'>
              <HeartHandshake />
              Subscribe for $3/mo
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
