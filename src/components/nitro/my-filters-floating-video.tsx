"use client";

import { useEffect } from "react";

import type { NitroAdOptions } from "@/types/nitro";
import { useIsDonator } from "@/hooks/use-is-donator";

const FLOATING_VIDEO_ID = "my-filters-floating-video";
const DESKTOP_QUERY = "(min-width: 1280px)";

// @ts-expect-error - No sizes for floating format
const OPTIONS: NitroAdOptions = {
  format: "floating",
  floating: {
    position: "bottom-right",
  },
  mediaQuery: DESKTOP_QUERY,
  report: {
    enabled: true,
    icon: true,
    wording: "Report Ad",
    position: "top-right",
  },
};

export function MyFiltersFloatingVideo() {
  const isDonator = useIsDonator();

  useEffect(() => {
    if (
      isDonator ||
      typeof window === "undefined" ||
      !window.nitroAds?.createAd
    ) {
      return;
    }

    window.nitroAds.createAd(FLOATING_VIDEO_ID, OPTIONS);
  }, [isDonator]);

  return null;
}
