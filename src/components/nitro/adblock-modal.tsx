"use client";

import { useEffect } from "react";
import Link from "next/link";
import { HeartHandshake } from "lucide-react";

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

interface AdblockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShown: () => void;
  onSubscribe: () => void;
  onDismiss: () => void;
}

export function AdblockModal({
  open,
  onOpenChange,
  onShown,
  onSubscribe,
  onDismiss,
}: AdblockModalProps) {
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
          <DialogTitle>Ads keep {siteConfig.name} free</DialogTitle>
          <DialogDescription>
            Ad revenue covers hosting and our monthly updates. Please allow ads
            for this site, or support the project and go ad-free.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button asChild className='w-full' onClick={onSubscribe}>
            <Link href='/donate'>
              <HeartHandshake />
              Support &amp; remove ads
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
