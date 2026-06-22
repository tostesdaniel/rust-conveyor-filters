// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { buildPineUrl, pineConfig, type PineCreative } from "@/config/pine";

import { PineBand } from "./pine-band";

const CREATIVE: PineCreative = {
  desktop: { src: "/pine/desktop.svg", width: 1200, height: 200 },
  mobile: { src: "/pine/mobile.svg", width: 640, height: 320 },
  alt: "Pine Hosting — recommended Rust server hosting",
};

describe("PineBand", () => {
  it("is a single link pointing at the placement's affiliate URL", () => {
    render(<PineBand placement='woven-band' creative={CREATIVE} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", buildPineUrl());
  });

  it("opens Pine in a new tab without leaking the referrer or window", () => {
    render(<PineBand placement='woven-band' creative={CREATIVE} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "sponsored noopener");
  });

  it("tags the click for Umami with the placement as a property", () => {
    render(<PineBand placement='hosting-page' creative={CREATIVE} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("data-umami-event", "pine-click");
    expect(link).toHaveAttribute("data-umami-event-placement", "hosting-page");
  });

  it("announces the creative's alt text on its imagery", () => {
    render(<PineBand placement='woven-band' creative={CREATIVE} />);

    // Both responsive variants are in the DOM; each carries the meaningful alt
    // so whichever one CSS reveals is announced.
    const images = screen.getAllByAltText(CREATIVE.alt);
    expect(images).toHaveLength(2);
  });

  it("swaps desktop and mobile creatives purely with CSS at the md breakpoint", () => {
    render(<PineBand placement='woven-band' creative={CREATIVE} />);

    const boxes = screen
      .getAllByAltText(CREATIVE.alt)
      .map((img) => img.parentElement);
    const classes = boxes.map((box) => box?.className ?? "");

    // Desktop box: hidden below md, revealed at md and up.
    expect(
      classes.some((c) => c.includes("hidden") && c.includes("md:block")),
    ).toBe(true);
    // Mobile box: shown below md, hidden at md and up.
    expect(classes.some((c) => c.includes("md:hidden"))).toBe(true);
  });

  it("lazy-loads both creatives so it never blocks the initial render", () => {
    render(<PineBand placement='woven-band' creative={CREATIVE} />);

    for (const img of screen.getAllByAltText(CREATIVE.alt)) {
      expect(img).toHaveAttribute("loading", "lazy");
    }
  });

  it("never distorts the creative (object-contain)", () => {
    render(<PineBand placement='woven-band' creative={CREATIVE} />);

    for (const img of screen.getAllByAltText(CREATIVE.alt)) {
      expect(img).toHaveClass("object-contain");
    }
  });

  it("labels the band as sponsored", () => {
    render(<PineBand placement='woven-band' creative={CREATIVE} />);

    expect(
      screen.getByText(pineConfig.copy.sponsoredLabel),
    ).toBeInTheDocument();
  });
});
