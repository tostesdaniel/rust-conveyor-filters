"use client";

import { HeartHandshake } from "lucide-react";
import { useMediaQuery } from "usehooks-ts";

import { BadgeType } from "@/types/badges";
import { siteConfig } from "@/config/site";
import { useDonateBannerState } from "@/hooks/use-donate-banner-state";
import {
  Banner,
  BannerDescription,
  BannerDismiss,
} from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { ButtonWithIcon } from "@/components/ui/button-with-icon";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { UserBadge } from "@/components/ui/user-badge";

interface DonateBannerProps {
  onDismiss: () => void;
}

export function DonateBannerDialog({ onDismiss }: DonateBannerProps) {
  const { dialogOpen, dismiss } = useDonateBannerState();
  const isDesktop = useMediaQuery("(min-width: 1024px)", {
    initializeWithValue: false,
  });

  if (isDesktop) {
    return (
      <div className='x pointer-events-none fixed inset-x-0 bottom-0 z-50 sm:flex sm:justify-center sm:px-6 sm:pb-5 lg:px-8'>
        <Banner className='pointer-events-auto flex-col border-b bg-accent sm:flex-row sm:items-center sm:rounded-xl sm:before:flex-1'>
          <BannerDescription className='flex items-center text-sm/6'>
            <span className='flex items-center font-semibold'>
              Support the project and get a{" "}
              <UserBadge type={BadgeType.DONATOR} className='mx-1' /> badge
            </span>
            <svg
              viewBox='0 0 2 2'
              aria-hidden='true'
              className='mx-2 inline h-0.5 w-0.5 fill-current'
            >
              <circle r={1} cx={1} cy={1} />
            </svg>
            <span className='flex items-center text-muted-foreground'>
              Content creator? Get a{" "}
              <UserBadge type={BadgeType.CONTENT_CREATOR} className='mx-1' /> on
              our
              <a
                href={siteConfig.links.discord}
                className='ml-1 font-medium text-foreground underline underline-offset-4 transition-colors hover:text-foreground/80'
                target='_blank'
                rel='noopener noreferrer'
              >
                Discord
              </a>
            </span>
          </BannerDescription>
          <BannerDismiss onClick={onDismiss} className='mr-10' />
        </Banner>
      </div>
    );
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={dismiss}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Donate</DialogTitle>
          <DialogDescription asChild>
            <div>
              Support the project and get a{" "}
              <UserBadge type={BadgeType.DONATOR} className='mx-1' /> badge.
              <Separator className='my-2' />
              Content creator? Get a{" "}
              <UserBadge type={BadgeType.CONTENT_CREATOR} className='mx-1' /> on
              our
              <a
                href={siteConfig.links.discord}
                className='ml-1 font-medium text-foreground underline underline-offset-4 transition-colors hover:text-foreground/80'
                target='_blank'
                rel='noopener noreferrer'
              >
                Discord
              </a>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button type='button' variant='secondary'>
              Cancel
            </Button>
          </DialogClose>
          <ButtonWithIcon type='button' icon={HeartHandshake}>
            Donate
          </ButtonWithIcon>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
