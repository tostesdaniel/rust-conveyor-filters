"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function PathnamePageviews() {
  const pathname = usePathname();
  const landed = useRef(false);

  useEffect(() => {
    if (!landed.current) {
      landed.current = true;
      return;
    }
    window.rybbit?.pageview();
  }, [pathname]);

  return null;
}
