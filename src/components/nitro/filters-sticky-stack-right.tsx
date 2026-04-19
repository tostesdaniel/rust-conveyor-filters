"use client";

import type { NitroAdOptions } from "@/types/nitro";
import { useIsAdFree } from "@/hooks/use-is-ad-free";
import { useNitroPlacement } from "@/components/nitro/use-nitro-placement";

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

  useNitroPlacement({
    id: RIGHT_RAIL_ID,
    options: OPTIONS,
    enabled: !isAdFree,
    preserveContainer: true,
  });

  if (isAdFree) return null;

  return (
    <div
      className='hidden min-h-full w-40 min-[1860px]:block'
      id={RIGHT_RAIL_ID}
    />
  );
}
