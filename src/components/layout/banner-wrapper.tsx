"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/utils/rybbit";
import { useClerk, useUser } from "@clerk/nextjs";

import { useAdblockCooldown } from "@/hooks/use-adblock-cooldown";
import { useBoostPromptCadence } from "@/hooks/use-boost-prompt-cadence";
import { useEngagementScore } from "@/hooks/use-engagement-score";
import { useIsAdFree } from "@/hooks/use-is-ad-free";
import {
  showBoostPrompt,
  type BoostPromptVariant,
} from "@/components/features/boost/boost-prompt";
import { DonateBannerDialog } from "@/components/features/donation/donate-banner-dialog";
import { DonateUpgradeModal } from "@/components/features/donation/donate-upgrade-modal";
import { AdblockModal } from "@/components/nitro/adblock-modal";
import { useAdblockDetected } from "@/components/nitro/use-adblock-detected";

// Grace period from mount so the modal never collides with first paint.
const ADBLOCK_MODAL_DELAY_MS = 4000;
const BOOST_PROMPT_DELAY_MS = 6000;
// Routes that actually host ad placements, the only ones the appeal and the
// Boost prompt show on.
const AD_ROUTE_PREFIXES = ["/filters", "/my-filters"];

type Surface = "none" | "adblock" | "modal" | "boost" | "banner";

// Module scope survives client navigations and resets on reload, so it's the
// session.
let surfaceShownThisSession = false;

function isAdRoute(pathname: string): boolean {
  return AD_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function useDelayElapsed(ms: number): boolean {
  const [elapsed, setElapsed] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setElapsed(true), ms);
    return () => window.clearTimeout(id);
  }, [ms]);
  return elapsed;
}

export function BannerWrapper() {
  const isAdFree = useIsAdFree();
  const { isLoaded, isSignedIn, user } = useUser();
  const { openUserProfile } = useClerk();
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

  const boostCadence = useBoostPromptCadence(isSignedIn === true && !isAdFree);
  // The client Clerk object drops the backend's `oauth_` prefix.
  const boostVariant: BoostPromptVariant = user?.externalAccounts.some(
    (account) => account.provider === "discord",
  )
    ? "linked"
    : "unlinked";

  // Latch the decision so a subsequent re-render (e.g. from SessionTick
  // bumping localStorage) cannot retroactively flip the session guard and
  // tear down the visible surface mid-flight.
  const [activeSurface, setActiveSurface] = useState<Surface>("none");
  const [modalOpen, setModalOpen] = useState(true);
  const [adblockOpen, setAdblockOpen] = useState(true);
  const adblockDelayElapsed = useDelayElapsed(ADBLOCK_MODAL_DELAY_MS);
  const boostDelayElapsed = useDelayElapsed(BOOST_PROMPT_DELAY_MS);

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
    if (activeSurface !== "none" || surfaceShownThisSession) return;

    const onAdRoute = isAdRoute(pathname);
    const adblockPending = adblockDetected === null && !inCooldown;
    const adblockReady = adblockDetected === true && !inCooldown && onAdRoute;
    // Detection can take longer than the 6s delay, and the appeal outranks us.
    const boostReady =
      boostCadence.due === true &&
      onAdRoute &&
      !adblockPending &&
      !adblockReady;
    // Otherwise the banner fires at mount and takes the Boost prompt's session.
    const holdBanner =
      !isLoaded ||
      boostCadence.due === null ||
      (boostCadence.due && onAdRoute && (!boostDelayElapsed || adblockPending));

    let next: Surface = "none";
    if (adblockDelayElapsed && adblockReady) {
      next = "adblock";
    } else if (modalDue) {
      next = "modal";
    } else if (boostDelayElapsed && boostReady) {
      next = "boost";
    } else if (bannerDue && !holdBanner) {
      next = "banner";
    }

    if (next === "none") return;
    surfaceShownThisSession = true;
    setActiveSurface(next);
  }, [
    activeSurface,
    adblockDelayElapsed,
    boostDelayElapsed,
    adblockDetected,
    inCooldown,
    pathname,
    isLoaded,
    boostCadence.due,
    bannerDue,
    modalDue,
  ]);

  const handleAdblockShown = useCallback(() => {
    markShown();
    trackEvent("adblock_modal_shown");
  }, [markShown]);

  const { recordClick, recordDismiss } = boostCadence;
  // StrictMode runs effects twice in dev, which double-tracked the show.
  const boostOpened = useRef(false);
  useEffect(() => {
    if (activeSurface !== "boost" || boostOpened.current) return;
    boostOpened.current = true;

    const variant = boostVariant;
    trackEvent("boost_prompt_shown", { variant });
    showBoostPrompt({
      variant,
      onCta: () => {
        trackEvent("boost_prompt_clicked", { variant });
        recordClick();
        if (variant === "unlinked") openUserProfile();
        setActiveSurface("none");
      },
      onDismiss: () => {
        trackEvent("boost_prompt_dismissed", { variant });
        recordDismiss();
        setActiveSurface("none");
      },
    });
  }, [
    activeSurface,
    boostVariant,
    openUserProfile,
    recordClick,
    recordDismiss,
  ]);

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
