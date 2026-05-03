"use client";

import { useEffect, useState } from "react";

import { useEngagementScore } from "@/hooks/use-engagement-score";
import { useIsAdFree } from "@/hooks/use-is-ad-free";
import { DonateBannerDialog } from "@/components/features/donation/donate-banner-dialog";
import { DonateUpgradeModal } from "@/components/features/donation/donate-upgrade-modal";

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

  // Latch the decision so a subsequent re-render (e.g. from SessionTick
  // bumping localStorage) cannot retroactively flip the session guard and
  // tear down the visible surface mid-flight.
  const [activeSurface, setActiveSurface] = useState<
    "none" | "banner" | "modal"
  >("none");
  const [modalOpen, setModalOpen] = useState(true);

  useEffect(() => {
    if (activeSurface !== "none") return;
    if (modalDue) setActiveSurface("modal");
    else if (bannerDue) setActiveSurface("banner");
  }, [activeSurface, bannerDue, modalDue]);

  if (isAdFree) return null;

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
