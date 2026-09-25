"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { ArrowRightIcon, XIcon } from "lucide-react";

import { siteConfig } from "@/config/site";
import { useIsAdFree } from "@/hooks/use-is-ad-free";
import { cn } from "@/lib/utils";
import { GemIcon } from "@/components/shared/gem-icon";

const DISMISS_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const EXIT_MS = 200;

const FOCUS_OUTLINE =
  "outline-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-(color:--boost-title)";

const ARROW_CLASS =
  "size-3.5 shrink-0 stroke-2 transition-transform duration-150 ease-out group-hover:translate-x-0.5";

function setBannerHeightCss(px: number) {
  document.documentElement.style.setProperty(
    "--new-feature-banner-height",
    `${px}px`,
  );
}

export function NewFeatureBannerStrip({
  cookieName,
  className,
}: {
  cookieName: string;
  className?: string;
}) {
  const isAdFree = useIsAdFree();
  const outerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"open" | "closing" | "closed">("open");
  const closed = state === "closed";

  useLayoutEffect(() => {
    const el = outerRef.current;
    if (!el) return;

    const update = () => setBannerHeightCss(el.getBoundingClientRect().height);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      ro.disconnect();
      document.documentElement.style.removeProperty(
        "--new-feature-banner-height",
      );
    };
  }, [closed]);

  const onDismiss = useCallback(() => {
    document.cookie = `${cookieName}=1; path=/; max-age=${DISMISS_COOKIE_MAX_AGE}; samesite=lax`;
    setState("closing");

    window.setTimeout(() => setState("closed"), EXIT_MS);
  }, [cookieName]);

  if (closed) return null;

  return (
    <div
      ref={outerRef}
      data-state={state}
      className='group/banner sticky top-0 z-100 grid grid-rows-[1fr] transition-[grid-template-rows] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] data-[state=closing]:grid-rows-[0fr]'
    >
      <div className='min-h-0 overflow-hidden'>
        <div
          className={cn(
            "boost-banner relative isolate flex items-center gap-x-4 px-4 py-2.5 text-(--boost-title) sm:px-6",
            "after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-(--boost-wash)",
            "transition-[transform,opacity] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] group-data-[state=closing]/banner:-translate-y-full group-data-[state=closing]/banner:opacity-0 motion-reduce:group-data-[state=closing]/banner:translate-y-0",
            className,
          )}
        >
          <div className='flex min-w-0 flex-1 items-center justify-center gap-x-6 text-xs/6 sm:text-sm/6'>
            <p className='text-center'>
              <span
                aria-hidden
                className='pointer-events-none mr-2 inline-block rounded-sm bg-(--boost-new)/15 px-1.5 py-0.5 align-[1px] text-[10px] leading-none font-bold tracking-wide text-(--boost-new) uppercase ring-1 ring-(--boost-new)/30 select-none ring-inset'
              >
                New
              </span>
              <strong className='mr-2 font-semibold'>
                Items now update on their own after every Rust patch.
              </strong>
              <a
                href={siteConfig.links.discord}
                target='_blank'
                rel='noopener noreferrer'
                className={cn(
                  FOCUS_OUTLINE,
                  "group -my-0.5 inline-flex items-center gap-1 rounded-full bg-(--boost-cta) py-0.5 pr-2 pl-2.5 align-middle text-xs/5 font-semibold whitespace-nowrap text-(--boost-cta-text) transition-[background-color,transform] duration-150 ease-out hover:bg-(--boost-cta-hover) active:scale-[0.97] active:bg-(--boost-cta-active)",
                )}
              >
                Get pinged
                <span className='hidden sm:inline'> on Discord</span>
                <ArrowRightIcon className={ARROW_CLASS} />
              </a>
            </p>
            {!isAdFree && (
              <p className='hidden items-center gap-x-2 border-l border-(--boost-wash) pl-6 xl:flex'>
                <GemIcon className='size-4 shrink-0' />
                <span className='text-(--boost-muted)'>
                  Boost the server, lose the ads.
                </span>
                <a
                  href={siteConfig.links.discordBoost}
                  target='_blank'
                  rel='noopener noreferrer'
                  className={cn(
                    FOCUS_OUTLINE,
                    "group inline-flex items-center gap-1 rounded-sm font-medium whitespace-nowrap underline decoration-(--boost-muted)/40 underline-offset-4 transition-colors hover:decoration-(--boost-title)",
                  )}
                >
                  Boost on Discord
                  <ArrowRightIcon className={ARROW_CLASS} />
                </a>
              </p>
            )}
          </div>
          <button
            type='button'
            onClick={onDismiss}
            className={cn(
              FOCUS_OUTLINE,
              "-m-1.5 shrink-0 rounded-md p-1.5 text-(--boost-muted) transition-[color,background-color,transform] duration-150 ease-out hover:bg-(--boost-wash) hover:text-(--boost-title) active:scale-[0.96]",
            )}
          >
            <span className='sr-only'>Dismiss</span>
            <XIcon aria-hidden='true' className='size-4' />
          </button>
        </div>
      </div>
    </div>
  );
}
