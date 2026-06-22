// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { pineConfig } from "@/config/pine";

import { Footer } from "./footer";

describe("Footer hosting link", () => {
  it("links to the internal /hosting page from any page", () => {
    render(<Footer />);

    const link = screen.getByRole("link", {
      name: pineConfig.copy.footerLinkLabel,
    });
    expect(link).toHaveAttribute("href", "/hosting");
    // Internal navigation, not an outbound new-tab link.
    expect(link).not.toHaveAttribute("target", "_blank");
  });

  it("tags footer clicks for Umami under their own placement", () => {
    render(<Footer />);

    const link = screen.getByRole("link", {
      name: pineConfig.copy.footerLinkLabel,
    });
    expect(link).toHaveAttribute("data-umami-event", "pine-click");
    expect(link).toHaveAttribute("data-umami-event-placement", "footer");
  });
});
