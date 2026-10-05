"use client";

import type { NitroAdOptions } from "@/types/nitro";
import { useIsAdFree } from "@/hooks/use-is-ad-free";
import { useNitroPlacement } from "@/components/nitro/use-nitro-placement";

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
  const isAdFree = useIsAdFree();

  useNitroPlacement({
    id: ANCHOR_MOBILE_ID,
    options: OPTIONS,
    enabled: !isAdFree,
  });

  return null;
}
