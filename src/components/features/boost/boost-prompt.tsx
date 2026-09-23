"use client";

import { useId } from "react";
import { XIcon } from "lucide-react";
import { toast } from "sonner";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { GemIcon } from "@/components/shared/gem-icon";

export type BoostPromptVariant = "linked" | "unlinked";

const SONNER_ID = "boost-prompt";

const COPY = {
  title: "Boost the server, lose the ads",
  linked: {
    body: "Boosting our Discord keeps the Rust Conveyor Filters community going. While your boost lasts, the site is ad-free for you and your profile shows the Server Booster badge. It switches on within a minute.",
    cta: "Boost on Discord",
  },
  unlinked: {
    body: "Boost our Discord and the site goes ad-free for you, with the Server Booster badge on your profile. Connect Discord first so we can see your boost. It's under Manage account in your profile menu.",
    cta: "Connect Discord",
  },
} as const;

interface BoostPromptProps {
  variant: BoostPromptVariant;
  onCta: () => void;
  onDismiss: () => void;
}

function BoostPromptCard({ variant, onCta, onDismiss }: BoostPromptProps) {
  const titleId = useId();
  const bodyId = useId();
  const copy = COPY[variant];

  return (
    <div
      role='status'
      aria-labelledby={titleId}
      aria-describedby={bodyId}
      className='relative w-full rounded-xl border bg-popover p-4 text-popover-foreground shadow-lg sm:w-[356px]'
    >
      <button
        type='button'
        aria-label='Close'
        onClick={onDismiss}
        className='absolute top-2 right-2 rounded-md p-1 text-muted-foreground hover:text-foreground'
      >
        <XIcon className='size-4' />
      </button>
      <div aria-hidden='true' className='mb-3'>
        <GemIcon className='size-8' />
      </div>
      <p id={titleId} className='pr-6 font-brand text-2xl uppercase'>
        {COPY.title}
      </p>
      <p id={bodyId} className='mt-1 text-sm text-muted-foreground'>
        {copy.body}
      </p>
      <div className='mt-4 flex gap-2'>
        {variant === "linked" ? (
          <a
            href={siteConfig.links.discordBoost}
            target='_blank'
            rel='noopener noreferrer'
            onClick={onCta}
            className={cn(buttonVariants(), "flex-1")}
          >
            {copy.cta}
          </a>
        ) : (
          <Button type='button' onClick={onCta} className='flex-1'>
            {copy.cta}
          </Button>
        )}
        <Button type='button' variant='ghost' onClick={onDismiss}>
          Not now
        </Button>
      </div>
    </div>
  );
}

// Sonner fires onDismiss for swipes and for our own toast.dismiss, so only the
// first exit counts.
export function showBoostPrompt({
  variant,
  onCta,
  onDismiss,
}: BoostPromptProps) {
  let settled = false;
  const settle = (outcome: "cta" | "dismiss") => {
    if (settled) return;
    settled = true;
    if (outcome === "cta") onCta();
    else onDismiss();
    toast.dismiss(SONNER_ID);
  };

  toast.custom(
    () => (
      <BoostPromptCard
        variant={variant}
        onCta={() => settle("cta")}
        onDismiss={() => settle("dismiss")}
      />
    ),
    {
      id: SONNER_ID,
      duration: Infinity,
      unstyled: true,
      onDismiss: () => settle("dismiss"),
    },
  );
}
