"use client";

import { useEffect } from "react";

import { useEngagementScore } from "@/hooks/use-engagement-score";
import { useIsAdFree } from "@/hooks/use-is-ad-free";

export function SessionTick() {
  const isAdFree = useIsAdFree();
  const { trackAction } = useEngagementScore();

  useEffect(() => {
    if (isAdFree) return;
    trackAction("session");
  }, [isAdFree, trackAction]);

  return null;
}
