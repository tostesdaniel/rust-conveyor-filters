export type PinePlacement =
  | "woven-band"
  | "hosting-page"
  | "footer"
  | "sidebar";

export interface PineCreativeAsset {
  src: string;
  /** Intrinsic pixel dimensions reserve space so CLS is zero. */
  width: number;
  height: number;
}

export interface PineCreative {
  desktop: PineCreativeAsset;
  mobile: PineCreativeAsset;
  alt: string;
}

export interface PineCadence {
  /** Real filter cards before the first band (band lands after the 12th). */
  firstOffset: number;
  /** Amount the gap grows after each band (12, 32, 60, 96, 140, …). */
  growthStep: number;
}

const PINE_CREATIVE: PineCreative = {
  desktop: { src: "/pine/banner-desktop.webp", width: 1200, height: 200 },
  mobile: { src: "/pine/banner-mobile.png", width: 1500, height: 457 },
  alt: "Pine Hosting — recommended Rust server hosting",
};

export const pineConfig = {
  enabled: true,
  affiliateUrl: "https://pine.host/rustconveyorfilters",
  creatives: [PINE_CREATIVE] as PineCreative[],
  cadence: {
    firstOffset: 12,
    growthStep: 8,
  } satisfies PineCadence,
  copy: {
    sponsoredLabel: "Sponsored",
    footerLinkLabel: "Hosting",
    sidebar: {
      heading: "Need a server?",
      pitch: "Pine Hosting is our recommended partner for Rust servers.",
      ctaLabel: "View hosting",
    },
  },
} as const;

/**
 * The outbound Pine affiliate URL, read from the live config.
 */
export function buildPineUrl(): string {
  return pineConfig.affiliateUrl;
}
