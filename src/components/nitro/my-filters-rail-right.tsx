"use client";

import { useEffect } from "react";

import type { NitroAdOptions } from "@/types/nitro";
import { useIsDonator } from "@/hooks/use-is-donator";

const RIGHT_RAIL_ID = "my-filters-rail-right";
const DESKTOP_QUERY = "(min-width: 1280px)";

const OPTIONS: NitroAdOptions = {
  format: "rail",
  rail: "right",
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

export function MyFiltersRailRight() {
  const isDonator = useIsDonator();

  useEffect(() => {
    if (
      isDonator ||
      typeof window === "undefined" ||
      !window.nitroAds?.createAd
    ) {
      return;
    }

    window.nitroAds.createAd(RIGHT_RAIL_ID, OPTIONS);
  }, [isDonator]);

  return null;
}
