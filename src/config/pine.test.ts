import { describe, expect, it } from "vitest";

import { buildPineUrl, pineConfig } from "./pine";

describe("buildPineUrl", () => {
  it("returns the live config's affiliate URL", () => {
    expect(buildPineUrl()).toBe(pineConfig.affiliateUrl);
  });

  it("produces a valid, parseable URL", () => {
    expect(() => new URL(buildPineUrl())).not.toThrow();
  });
});

describe("pineConfig", () => {
  it("uses the tuned-down cadence (first offset 12, growth step 8)", () => {
    expect(pineConfig.cadence.firstOffset).toBe(12);
    expect(pineConfig.cadence.growthStep).toBe(8);
  });

  it("registers at least one creative with both responsive assets", () => {
    expect(pineConfig.creatives.length).toBeGreaterThan(0);
    for (const creative of pineConfig.creatives) {
      expect(creative.desktop.width).toBeGreaterThan(0);
      expect(creative.desktop.height).toBeGreaterThan(0);
      expect(creative.mobile.width).toBeGreaterThan(0);
      expect(creative.mobile.height).toBeGreaterThan(0);
      expect(creative.alt.length).toBeGreaterThan(0);
    }
  });
});
