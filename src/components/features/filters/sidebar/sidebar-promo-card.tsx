"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Server } from "lucide-react";

import { pineConfig } from "@/config/pine";
import { useIsAdFree } from "@/hooks/use-is-ad-free";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SidebarDonateCard } from "@/components/features/filters/sidebar/sidebar-donate-card";

/**
 * One sidebar slot, seen on every `/filters` visit, that renders the donate
 * card for non-supporters and the Pine partner card for ad-free supporters
 * (whose donate card and Nitro ads are both suppressed).
 *
 * The donate card is the SSR-safe default so the common ~95% path paints with
 * no delay; `useIsAdFree` resolves client-side (Clerk's `useUser()` is `null`
 * until loaded), so for supporters the slot crossfades donate → Pine on resolve
 * (opacity-only, no transform — prefers-reduced-motion safe).
 *
 * It reads `useIsAdFree` only to pick which CTA to show — never to hide Pine —
 * and links internally to `/hosting`, touching no Nitro components or adblock
 * state.
 */
export function SidebarPromoCard({ className }: { className?: string }) {
  const isAdFree = useIsAdFree();
  const slot: "donate" | "pine" | "empty" = !isAdFree
    ? "donate"
    : pineConfig.enabled
      ? "pine"
      : "empty";

  // Animate every swap *except* the first paint, so the SSR-default donate card
  // appears instantly while the later donate → Pine resolve crossfades in.
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
  }, []);

  if (slot === "empty") return null;

  return (
    <div
      key={slot}
      className={cn(mounted.current && "animate-in fade-in-0 duration-150")}
    >
      {slot === "donate" ? (
        <SidebarDonateCard className={className} />
      ) : (
        <SidebarPineCard className={className} />
      )}
    </div>
  );
}

function SidebarPineCard({ className }: { className?: string }) {
  const { heading, pitch, ctaLabel } = pineConfig.copy.sidebar;

  return (
    <div
      className={cn(
        "relative rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm",
        className,
      )}
    >
      <span className='absolute right-2 top-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white'>
        {pineConfig.copy.sponsoredLabel}
      </span>
      <div className='flex items-center gap-2 pr-16 font-semibold text-foreground'>
        <Server className='size-4 text-primary' />
        <span>{heading}</span>
      </div>
      <p className='mt-1 text-xs leading-snug text-muted-foreground'>{pitch}</p>
      <Button
        asChild
        size='sm'
        className='mt-2 h-8 w-full gap-1.5 text-xs font-medium'
      >
        <Link
          href='/hosting'
          data-umami-event='pine-click'
          data-umami-event-placement='sidebar'
        >
          {ctaLabel}
        </Link>
      </Button>
    </div>
  );
}
