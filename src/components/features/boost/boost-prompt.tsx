"use client";

import { useId, type CSSProperties } from "react";
import { XIcon } from "lucide-react";
import { toast } from "sonner";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { GemIcon } from "@/components/shared/gem-icon";

import { BoostGlow } from "./boost-glow";

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

const FOCUS_OUTLINE =
  "outline-none focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-(color:--boost-title)";

const CTA_CLASS = cn(
  buttonVariants(),
  FOCUS_OUTLINE,
  "relative h-10 w-full rounded-[8px] bg-(color:--boost-cta) font-semibold text-(color:--boost-cta-text) hover:bg-(color:--boost-cta-hover) active:bg-(color:--boost-cta-active)",
);

const QUIET_BUTTON_CLASS =
  "text-(color:--boost-muted) hover:bg-(color:--boost-wash) hover:text-(color:--boost-title)";

const SPARKLES = [
  {
    className: "top-0 left-0.5 size-3 text-(color:--boost-mint)",
    duration: "2.4s",
    delay: "200ms",
  },
  {
    className: "top-1.5 right-0 size-2.5 text-(color:--boost-lavender)",
    duration: "2.8s",
    delay: "900ms",
  },
  {
    className: "bottom-1 left-0 size-2 text-(color:--boost-lavender)",
    duration: "3.2s",
    delay: "1500ms",
  },
] as const;

function BoostPromptCard({ variant, onCta, onDismiss }: BoostPromptProps) {
  const titleId = useId();
  const bodyId = useId();
  const copy = COPY[variant];

  return (
    // Sonner's section is already a polite live region, so a live status here
    // would read the prompt twice. The role stays for the name and description.
    <div
      role='status'
      aria-live='off'
      aria-labelledby={titleId}
      aria-describedby={bodyId}
      className='boost-card relative w-full rounded-xl border border-border px-5 pt-4 pb-5 font-sans text-(color:--boost-title) shadow-lg sm:w-[356px]'
    >
      <button
        type='button'
        aria-label='Close'
        onClick={onDismiss}
        className={cn(
          FOCUS_OUTLINE,
          QUIET_BUTTON_CLASS,
          "absolute top-2.5 right-2.5 rounded-md p-1 transition-colors",
        )}
      >
        <XIcon className='size-4' />
      </button>
      <div
        aria-hidden='true'
        className='relative mx-auto mb-2 grid size-14 place-items-center'
      >
        <span className='relative size-10'>
          <GemIcon className='size-10' />
          <span className='boost-shimmer absolute inset-0' />
        </span>
        {SPARKLES.map(({ className, duration, delay }) => (
          <svg
            key={className}
            viewBox='0 0 24 24'
            fill='currentColor'
            className={cn("boost-sparkle absolute", className)}
            style={
              {
                "--twinkle-duration": duration,
                "--twinkle-delay": delay,
              } as CSSProperties
            }
          >
            <path d='M12 0c.8 6.6 4.6 10.9 12 12-7.4 1.1-11.2 5.4-12 12-.8-6.6-4.6-10.9-12-12 7.4-1.1 11.2-5.4 12-12z' />
          </svg>
        ))}
      </div>
      <p
        id={titleId}
        className='px-6 text-center font-brand text-[30px] leading-none tracking-[-0.02em] text-balance uppercase [text-shadow:var(--boost-title-shadow)]'
      >
        {COPY.title}
      </p>
      <p
        id={bodyId}
        className='mt-2 text-center text-sm leading-relaxed text-(color:--boost-muted)'
      >
        {copy.body}
      </p>
      <div className='mt-4 flex gap-2'>
        <BoostGlow className='flex-1'>
          {variant === "linked" ? (
            <a
              href={siteConfig.links.discordBoost}
              target='_blank'
              rel='noopener noreferrer'
              onClick={onCta}
              className={CTA_CLASS}
            >
              {copy.cta}
            </a>
          ) : (
            <Button type='button' onClick={onCta} className={CTA_CLASS}>
              {copy.cta}
            </Button>
          )}
        </BoostGlow>
        <Button
          type='button'
          variant='ghost'
          onClick={onDismiss}
          className={cn(
            FOCUS_OUTLINE,
            QUIET_BUTTON_CLASS,
            "relative h-10 rounded-[8px] dark:hover:bg-(color:--boost-wash)",
          )}
        >
          Not now
        </Button>
      </div>
    </div>
  );
}

export function hideBoostPrompt() {
  toast.dismiss(SONNER_ID);
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
      className: "boost-toast",
      onDismiss: () => settle("dismiss"),
    },
  );
}
