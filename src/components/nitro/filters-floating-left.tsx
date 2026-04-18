"use client";

import type { NitroAdOptions } from "@/types/nitro";
import { useIsAdFree } from "@/hooks/use-is-ad-free";
import { useNitroPlacement } from "@/components/nitro/use-nitro-placement";

const FLOATING_LEFT_ID = "filters-floating-left";
const DESKTOP_QUERY = "(min-width: 1460px)";

// @ts-expect-error - No sizes for floating format
const OPTIONS: NitroAdOptions = {
  format: "floating",
  floating: {
    position: "bottom-left",
  },
  mediaQuery: DESKTOP_QUERY,
  report: {
    enabled: true,
    icon: true,
    wording: "Report Ad",
    position: "top-right",
  },
};

export function FiltersFloatingLeft() {
  const isAdFree = useIsAdFree();

  useNitroPlacement({
    id: FLOATING_LEFT_ID,
    options: OPTIONS,
    enabled: !isAdFree,
  });

  return null;
}
