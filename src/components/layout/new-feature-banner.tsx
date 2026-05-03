"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRightIcon, XIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export const NEW_FEATURE_BANNER_CAMPAIGN_ID = "user-profiles-2026-05";

function dismissalStorageKey(campaignId: string): string {
  return `new-feature-banner-dismissed:${campaignId}`;
}

function setBannerHeightCss(px: number) {
  document.documentElement.style.setProperty(
    "--new-feature-banner-height",
    px > 0 ? `${px}px` : "0px",
  );
}

export function NewFeatureBanner({
  className,
  campaignId = NEW_FEATURE_BANNER_CAMPAIGN_ID,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  campaignId?: string;
}) {
  const bannerOuterRef = useRef<HTMLDivElement>(null);
  const [dismissed, setDismissed] = useState<boolean | null>(null);
  const [spacerHeight, setSpacerHeight] = useState(0);

  useLayoutEffect(() => {
    const key = dismissalStorageKey(campaignId);
    setDismissed(localStorage.getItem(key) === "true");

    const onStorage = (e: StorageEvent) => {
      if (e.key !== null && e.key !== key) return;
      setDismissed(localStorage.getItem(key) === "true");
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [campaignId]);

  useLayoutEffect(() => {
    if (dismissed !== false) {
      setSpacerHeight(0);
      setBannerHeightCss(0);
      return;
    }

    const el = bannerOuterRef.current;
    if (!el) {
      setBannerHeightCss(0);
      return;
    }

    const update = () => {
      const h = el.getBoundingClientRect().height;
      setSpacerHeight(h);
      setBannerHeightCss(h);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      ro.disconnect();
    };
  }, [dismissed]);

  useLayoutEffect(() => {
    return () => {
      setBannerHeightCss(0);
    };
  }, []);

  const onDismiss = useCallback(() => {
    const key = dismissalStorageKey(campaignId);
    setDismissed(true);
    localStorage.setItem(key, "true");
    setSpacerHeight(0);
    setBannerHeightCss(0);
  }, [campaignId]);

  if (dismissed !== false) {
    return null;
  }

  return (
    <>
      <div aria-hidden className='shrink-0' style={{ height: spacerHeight }} />
      <div
        ref={bannerOuterRef}
        className={cn(
          "fixed inset-x-0 top-0 isolate z-100 flex flex-wrap items-center gap-x-6 gap-y-2 overflow-hidden bg-background px-6 py-2.5 before:relative sm:px-3.5 sm:before:flex-1 dark:bg-background dark:before:bg-secondary/30",
          "after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-white/10",
          className,
        )}
        {...props}
      >
        <div
          aria-hidden='true'
          className='pointer-events-none absolute top-1/2 left-[max(-7rem,calc(50%-52rem))] -z-10 -translate-y-1/2 transform-gpu blur-2xl'
        >
          <div
            style={{
              clipPath:
                "polygon(74.8% 41.9%, 97.2% 73.2%, 100% 34.9%, 92.5% 0.4%, 87.5% 0%, 75% 28.6%, 58.5% 54.6%, 50.1% 56.8%, 46.9% 44%, 48.3% 17.4%, 24.7% 53.9%, 0% 27.9%, 11.9% 74.2%, 24.9% 54.1%, 68.6% 100%, 74.8% 41.9%)",
            }}
            className='aspect-577/310 w-144.25 bg-linear-to-r from-[#4361ee] to-[#4cc9f0] opacity-30 dark:opacity-40'
          />
        </div>
        <div
          aria-hidden='true'
          className='pointer-events-none absolute top-1/2 left-[max(45rem,calc(50%+8rem))] -z-10 -translate-y-1/2 transform-gpu blur-2xl'
        >
          <div
            style={{
              clipPath:
                "polygon(74.8% 41.9%, 97.2% 73.2%, 100% 34.9%, 92.5% 0.4%, 87.5% 0%, 75% 28.6%, 58.5% 54.6%, 50.1% 56.8%, 46.9% 44%, 48.3% 17.4%, 24.7% 53.9%, 0% 27.9%, 11.9% 74.2%, 24.9% 54.1%, 68.6% 100%, 74.8% 41.9%)",
            }}
            className='aspect-577/310 w-144.25 bg-linear-to-r from-[#4361ee] to-[#4cc9f0] opacity-30 dark:opacity-40'
          />
        </div>

        <p className='inline-flex min-w-0 flex-wrap items-center text-sm/6 text-foreground'>
          <span
            className='pointer-events-none z-10 mr-2 rounded-sm border-emerald-950/20 bg-emerald-900 px-1.5 py-0.5 text-[10px] leading-none font-bold tracking-wide text-emerald-50 uppercase shadow-sm ring-1 ring-sidebar select-none dark:border-emerald-800/50 dark:bg-emerald-950 dark:text-emerald-100'
            title='New — filter by tags'
            aria-hidden
          >
            New
          </span>
          <strong className='font-medium tracking-wide'>
            User Profiles are here! 🎉{" "}
          </strong>

          <span className='px-1 whitespace-nowrap text-foreground/80'>
            Click their username to view their profile.
          </span>

          <Link
            href='/users/rustconveyorfilters'
            className='group inline-flex items-center gap-1 underline underline-offset-2 transition-colors dark:hover:text-white'
          >
            Try it out now!
            <ArrowRightIcon className='size-3.5 shrink-0 stroke-2 transition-transform group-hover:translate-x-px' />
          </Link>
        </p>
        <div className='flex flex-1 justify-end'>
          <button
            type='button'
            className='-m-3 p-3 focus-visible:-outline-offset-4'
            onClick={onDismiss}
          >
            <span className='sr-only'>Dismiss</span>
            <XIcon
              aria-hidden='true'
              className='size-5 text-secondary-foreground'
            />
          </button>
        </div>
      </div>
    </>
  );
}
