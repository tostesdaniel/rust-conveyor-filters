"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { useAdblockCooldown } from "@/hooks/use-adblock-cooldown";
import { useEngagementScore } from "@/hooks/use-engagement-score";
import { useIsAdFree } from "@/hooks/use-is-ad-free";
import { trackEvent } from "@/utils/rybbit";
import { DonateBannerDialog } from "@/components/features/donation/donate-banner-dialog";
import { DonateUpgradeModal } from "@/components/features/donation/donate-upgrade-modal";
import { AdblockModal } from "@/components/nitro/adblock-modal";
import { useAdblockDetected } from "@/components/nitro/use-adblock-detected";

// Grace period from mount so the modal never collides with first paint.
const ADBLOCK_MODAL_DELAY_MS = 4000;
// Routes that actually host ad placements — the only ones the appeal shows on.
const AD_ROUTE_PREFIXES = ["/filters", "/my-filters"];

function isAdRoute(pathname: string): boolean {
  return AD_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function BannerWrapper() {
  const isAdFree = useIsAdFree();
  const {
    bannerDue,
    modalDue,
    markBannerShown,
    dismissBanner,
    markModalShown,
    dismissModal,
  } = useEngagementScore();

  const pathname = usePathname();
  const adblockDetected = useAdblockDetected();
  const { inCooldown, markShown } = useAdblockCooldown();

  // Latch the decision so a subsequent re-render (e.g. from SessionTick
  // bumping localStorage) cannot retroactively flip the session guard and
  // tear down the visible surface mid-flight.
  const [activeSurface, setActiveSurface] = useState<
    "none" | "adblock" | "banner" | "modal"
  >("none");
  const [modalOpen, setModalOpen] = useState(true);
  const [adblockOpen, setAdblockOpen] = useState(true);
  const [delayElapsed, setDelayElapsed] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(
      () => setDelayElapsed(true),
      ADBLOCK_MODAL_DELAY_MS,
    );
    return () => window.clearTimeout(id);
  }, []);

  // Skipped for ad-free users: they never load the Nitro script, so the
  // detector would otherwise always report "blocked" for them.
  const detectedReported = useRef(false);
  useEffect(() => {
    if (adblockDetected && !isAdFree && !detectedReported.current) {
      detectedReported.current = true;
      trackEvent("adblock_detected");
    }
  }, [adblockDetected, isAdFree]);

  useEffect(() => {
    if (activeSurface !== "none") return;
    if (delayElapsed && adblockDetected && !inCooldown && isAdRoute(pathname)) {
      setActiveSurface("adblock");
    } else if (modalDue) {
      setActiveSurface("modal");
    } else if (bannerDue) {
      setActiveSurface("banner");
    }
  }, [
    activeSurface,
    delayElapsed,
    adblockDetected,
    inCooldown,
    pathname,
    bannerDue,
    modalDue,
  ]);

  const handleAdblockShown = useCallback(() => {
    markShown();
    trackEvent("adblock_modal_shown");
  }, [markShown]);

  if (isAdFree) return null;

  if (activeSurface === "adblock") {
    return (
      <AdblockModal
        open={adblockOpen}
        onOpenChange={setAdblockOpen}
        onShown={handleAdblockShown}
        onSubscribe={() => {
          trackEvent("adblock_modal_subscribe_clicked");
          setActiveSurface("none");
        }}
        onDismiss={() => {
          trackEvent("adblock_modal_dismissed");
          setActiveSurface("none");
        }}
      />
    );
  }

  if (activeSurface === "modal") {
    return (
      <DonateUpgradeModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onShown={markModalShown}
        onDismiss={() => {
          dismissModal();
          setActiveSurface("none");
        }}
      />
    );
  }

  if (activeSurface === "banner") {
    return (
      <DonateBannerDialog
        open
        onShown={markBannerShown}
        onDismiss={() => {
          dismissBanner();
          setActiveSurface("none");
        }}
      />
    );
  }

  return null;
}
