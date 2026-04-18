"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import type { NitroAd, NitroAdOptions } from "@/types/nitro";

type UseNitroPlacementParams = {
  id: string;
  options: NitroAdOptions;
  enabled: boolean;
  preserveContainer?: boolean;
};

function normalizeNitroAds(
  adResult: NitroAd | Promise<NitroAd> | Promise<NitroAd[]> | null,
): Promise<NitroAd[]> {
  if (!adResult) {
    return Promise.resolve([]);
  }

  return Promise.resolve(adResult).then((resolvedAd) => {
    if (Array.isArray(resolvedAd)) {
      return resolvedAd;
    }

    return [resolvedAd];
  });
}

function notifyNavigation(activeAds: NitroAd[], href: string) {
  for (const ad of activeAds) {
    ad.onNavigate?.(href);
  }
}

function clearPlacementDom(id: string, preserveContainer: boolean) {
  if (typeof document === "undefined") {
    return;
  }

  const placementElement = document.getElementById(id);

  if (!placementElement) {
    return;
  }

  if (preserveContainer) {
    placementElement.replaceChildren();
    return;
  }

  placementElement.remove();
}

export function useNitroPlacement({
  id,
  options,
  enabled,
  preserveContainer = false,
}: UseNitroPlacementParams) {
  const pathname = usePathname();
  const activeAdsRef = useRef<NitroAd[]>([]);

  useEffect(() => {
    let isDisposed = false;

    const cleanupPlacement = () => {
      const href =
        typeof window === "undefined" ? pathname : window.location.href;

      notifyNavigation(activeAdsRef.current, href);
      activeAdsRef.current = [];
      clearPlacementDom(id, preserveContainer);
    };

    cleanupPlacement();

    if (
      typeof window === "undefined" ||
      !enabled ||
      !window.nitroAds?.createAd
    ) {
      return cleanupPlacement;
    }

    void normalizeNitroAds(window.nitroAds.createAd(id, options))
      .then((resolvedAds) => {
        if (isDisposed) {
          notifyNavigation(resolvedAds, window.location.href);
          clearPlacementDom(id, preserveContainer);
          return;
        }

        activeAdsRef.current = resolvedAds;
      })
      .catch(() => {
        activeAdsRef.current = [];
        clearPlacementDom(id, preserveContainer);
      });

    return () => {
      isDisposed = true;
      cleanupPlacement();
    };
  }, [enabled, id, options, pathname, preserveContainer]);
}
