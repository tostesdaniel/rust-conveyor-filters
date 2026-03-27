"use client";

import { useEffect } from "react";

import type { NitroAdOptions } from "@/types/nitro";

const LEFT_RAIL_ID = "my-filters-rail-left";
const DESKTOP_QUERY = "(min-width: 1280px)";

const OPTIONS: NitroAdOptions = {
  format: "rail",
  rail: "left",
  railVerticalAlign: "top",
  railStickyTop: 108,
  sizes: [
    ["160", "600"],
    ["300", "600"],
  ],
  report: {
    enabled: true,
    icon: true,
    wording: "Report Ad",
    position: "top-right",
  },
  mediaQuery: DESKTOP_QUERY,
};

export function MyFiltersRailLeft() {
  useEffect(() => {
    if (typeof window === "undefined" || !window.nitroAds?.createAd) {
      return;
    }

    window.nitroAds.createAd(LEFT_RAIL_ID, OPTIONS);
  }, []);

  return null;
}
