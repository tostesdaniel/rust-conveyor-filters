"use client";

import { useEffect } from "react";

import type { NitroAdOptions } from "@/types/nitro";

const LEFT_RAIL_ID = "filters-rail-left";
const DESKTOP_QUERY = "(min-width: 1860px)";

const OPTIONS: NitroAdOptions = {
  format: "sticky-stack",
  stickyStackLimit: 15,
  stickyStackSpace: 2,
  stickyStackOffset: 64,
  stickyStackResizable: true,
  sizes: [["160", "600"]],
  report: {
    enabled: true,
    icon: true,
    wording: "Report Ad",
    position: "bottom-right",
  },
  mediaQuery: DESKTOP_QUERY,
};

export function FiltersStickyStackLeft() {
  useEffect(() => {
    if (typeof window === "undefined" || !window.nitroAds?.createAd) {
      return;
    }

    window.nitroAds.createAd(LEFT_RAIL_ID, OPTIONS);
  }, []);

  return <div id={LEFT_RAIL_ID} className='max-[1860px]:hidden' />;
}
