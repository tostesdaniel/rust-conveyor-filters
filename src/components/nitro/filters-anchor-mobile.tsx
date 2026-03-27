"use client";

import { useEffect } from "react";

import type { NitroAdOptions } from "@/types/nitro";

const ANCHOR_MOBILE_ID = "filters-anchor-mobile";
const MOBILE_QUERY = "(max-width: 767px)";

// @ts-expect-error - No sizes for anchor format
const OPTIONS: NitroAdOptions = {
  format: "anchor",
  anchor: "top",
  mediaQuery: MOBILE_QUERY,
  anchorBgColor: "transparent",
  report: {
    enabled: true,
    icon: true,
    wording: "Report Ad",
    position: "top-right",
  },
};

export function FiltersAnchorMobile() {
  useEffect(() => {
    if (typeof window === "undefined" || !window.nitroAds?.createAd) {
      return;
    }

    window.nitroAds.createAd(ANCHOR_MOBILE_ID, OPTIONS);
  }, []);

  return null;
}
