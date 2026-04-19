"use client";

import type { NitroAdOptions } from "@/types/nitro";
import { useIsAdFree } from "@/hooks/use-is-ad-free";
import { useNitroPlacement } from "@/components/nitro/use-nitro-placement";

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
  const isAdFree = useIsAdFree();

  useNitroPlacement({
    id: FLOATING_VIDEO_ID,
    options: OPTIONS,
    enabled: !isAdFree,
  });

  return null;
}
