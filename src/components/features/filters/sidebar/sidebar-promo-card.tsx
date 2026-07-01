"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Server } from "lucide-react";

import { pineConfig } from "@/config/pine";
import { useIsAdFree } from "@/hooks/use-is-ad-free";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SidebarDonateCard } from "@/components/features/filters/sidebar/sidebar-donate-card";
import { rollPineBucket } from "@/components/features/filters/sidebar/pine-bucket";

/**
 * One sidebar slot, seen on every `/filters` visit, that surfaces the Pine
 * partner card to two audiences and the donate card to everyone else:
 *
 * - **Ad-free supporters** always see Pine. Their donate card and Nitro ads
 *   are both suppressed, so the slot is free.
 * - **Non-ad-free visitors** see Pine for a stable, per-visit `sidebarPineShare`
 *   of the time and the donate card otherwise. This widens the path to
 *   `/hosting`, which is otherwise only reachable via the footer and
 *   unreachable on the infinite `/filters` grid.
 *
 * The donate card is the SSR-safe default so the common path paints with no
 * delay. Both the ad-free check (`useUser()` is `null` until Clerk loads) and
 * the per-visit roll resolve client-side, so a visitor promoted to Pine
 * crossfades donate to Pine on resolve (opacity-only, no transform, so it
 * stays safe under prefers-reduced-motion). The roll is cached per page load
 * in `rollPineBucket`, so it never flickers mid-visit.
 *
 * The slot links internally to `/hosting`, touching no Nitro components or
 * adblock state.
 */
export function SidebarPromoCard({ className }: { className?: string }) {
  const isAdFree = useIsAdFree();

  // Client-only per-visit roll for non-ad-free visitors. Stays `false` on SSR
  // and first paint so the donate card is the hydration-safe default; the real
  // roll lands in the effect below and crossfades Pine in for the chosen share.
  const [rolledPine, setRolledPine] = useState(false);
  useEffect(() => {
    setRolledPine(rollPineBucket(pineConfig.sidebarPineShare));
  }, []);

  const showPine = pineConfig.enabled && (isAdFree || rolledPine);
  const slot: "donate" | "pine" | "empty" = showPine
    ? "pine"
    : isAdFree
      ? "empty"
      : "donate";

  // The audience that reaches Pine, for analytics: supporters who always see it
  // vs. non-ad-free visitors rolled into the new discovery bridge.
  const audience: "adfree" | "rolled" = isAdFree ? "adfree" : "rolled";

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
        <SidebarPineCard className={className} audience={audience} />
      )}
    </div>
  );
}

function SidebarPineCard({
  className,
  audience,
}: {
  className?: string;
  audience: "adfree" | "rolled";
}) {
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
          data-umami-event-audience={audience}
        >
          {ctaLabel}
        </Link>
      </Button>
    </div>
  );
}
