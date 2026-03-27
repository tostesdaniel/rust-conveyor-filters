"use client";

import { useEffect } from "react";

import type { NitroAdOptions } from "@/types/nitro";

const RIGHT_RAIL_ID = "filters-rail-right";
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

export function FiltersStickyStackRight() {
  useEffect(() => {
    if (typeof window === "undefined" || !window.nitroAds?.createAd) {
      return;
    }

    window.nitroAds.createAd(RIGHT_RAIL_ID, OPTIONS);
  }, []);

  return <div id={RIGHT_RAIL_ID} className='max-[1860px]:hidden' />;
}
