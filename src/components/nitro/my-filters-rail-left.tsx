"use client";

import { useEffect } from "react";

import type { NitroAdOptions } from "@/types/nitro";
import { useIsAdFree } from "@/hooks/use-is-ad-free";

const LEFT_RAIL_ID = "my-filters-rail-left";
const DESKTOP_QUERY = "(min-width: 1640px)";

const OPTIONS: NitroAdOptions = {
  format: "rail",
  rail: "left",
  railVerticalAlign: "top",
  railStickyTop: 108,
  sizes: [["160", "600"]],
  report: {
    enabled: true,
    icon: true,
    wording: "Report Ad",
    position: "top-right",
  },
  mediaQuery: DESKTOP_QUERY,
};

export function MyFiltersRailLeft() {
  const isAdFree = useIsAdFree();

  useEffect(() => {
    if (
      isAdFree ||
      typeof window === "undefined" ||
      !window.nitroAds?.createAd
    ) {
      return;
    }

    window.nitroAds.createAd(LEFT_RAIL_ID, OPTIONS);
  }, [isAdFree]);

  return null;
}
