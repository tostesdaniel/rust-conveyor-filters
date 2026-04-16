"use client";

import { useEffect } from "react";

import type { NitroAdOptions } from "@/types/nitro";
import { useIsAdFree } from "@/hooks/use-is-ad-free";

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
  const isAdFree = useIsAdFree();

  useEffect(() => {
    if (
      isAdFree ||
      typeof window === "undefined" ||
      !window.nitroAds?.createAd
    ) {
      return;
    }

    window.nitroAds.createAd(RIGHT_RAIL_ID, OPTIONS);
  }, [isAdFree]);

  if (isAdFree) return null;

  return (
    <div
      className='min-w-[1860px]:block hidden min-h-full w-40'
      id={RIGHT_RAIL_ID}
    />
  );
}
