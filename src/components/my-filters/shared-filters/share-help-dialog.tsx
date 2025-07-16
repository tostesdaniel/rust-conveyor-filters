import { EllipsisVerticalIcon, HelpCircleIcon, Share2Icon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Typography } from "@/components/shared/typography";

interface ShareHelpDialogProps {
  className?: string;
}

export function ShareHelpDialog({ className }: ShareHelpDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type='button' variant='ghost' className={cn(className)}>
          <HelpCircleIcon />
          <span>How to Share Filters</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className='-ml-1.5'>
            <span
              role='img'
              aria-label='Light bulb emoji'
              className='select-none'
            >
              💡
            </span>{" "}
            How to Share Filters
          </DialogTitle>
          <DialogDescription className='pt-4'>
            <div className='space-y-6'>
              <section aria-labelledby='share-filters-heading'>
                <h3 id='share-filters-heading' className='mb-2 font-semibold'>
                  To share your filters with others:
                </h3>
                <ol className='list-inside list-decimal space-y-2 text-sm'>
                  <li>
                    Go to{" "}
                    <Typography
                      variant='inlineCode'
                      className='text-xs'
                      aria-label='Your Filters tab'
                    >
                      Your Filters
                    </Typography>{" "}
                    tab
                  </li>
                  <li>
                    Click the{" "}
                    <span
                      aria-label='Menu button example'
                      role='presentation'
                      className='relative inline-flex size-6 items-center justify-center px-1.5 -indent-px font-serif font-bold text-secondary-foreground before:absolute before:inset-0 before:rounded-full before:bg-accent'
                    >
                      <EllipsisVerticalIcon
                        className='relative size-4'
                        aria-hidden='true'
                      />
                    </span>{" "}
                    menu on any filter or category
                  </li>
                  <li>
                    Select{" "}
                    <span
                      className={cn(
                        buttonVariants({
                          variant: "secondary",
                        }),
                        "h-5 rounded-sm px-1.5 py-0 text-sm font-normal [&_svg]:size-3",
                      )}
                      role='presentation'
                      aria-label='Share button example'
                    >
                      <Share2Icon aria-hidden='true' />
                      Share
                    </span>
                  </li>
                  <li>Enter your friend&apos;s personal token</li>
                </ol>
              </section>

              <section aria-labelledby='receive-filters-heading'>
                <h3 id='receive-filters-heading' className='mb-2 font-semibold'>
                  To receive shared filters:
                </h3>
                <ol className='list-inside list-decimal space-y-2 text-sm'>
                  <li>
                    Go to{" "}
                    <Typography
                      variant='inlineCode'
                      className='text-xs'
                      aria-label='Shared With You tab'
                    >
                      Shared With You
                    </Typography>{" "}
                    tab
                  </li>
                  <li>Copy your personal token</li>
                  <li>Share your token with friends</li>
                  <li>Wait for them to share filters with you</li>
                </ol>
              </section>
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
