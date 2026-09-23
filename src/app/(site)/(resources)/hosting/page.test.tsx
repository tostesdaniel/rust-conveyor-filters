// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { buildPineUrl } from "@/config/pine";

import { hostingCopy } from "./content";
import HostingPage, { metadata } from "./page";

// These tests cover the two things the /hosting affiliate page must always
// hold: the affiliate contract (a sponsored link to Pine) and the page staying
// indexable with on-topic metadata.
describe("/hosting page", () => {
  it("offers the affiliate CTA to Pine", () => {
    render(<HostingPage />);
    const pineLinks = screen
      .getAllByRole("link")
      .filter((a) => a.getAttribute("href") === buildPineUrl());
    expect(pineLinks.length).toBeGreaterThan(0);
    expect(pineLinks[0]).toHaveAttribute("rel", "sponsored noopener");
  });

  it("carries a plain affiliate disclosure", () => {
    render(<HostingPage />);
    expect(screen.getByText(hostingCopy.disclosure)).toBeInTheDocument();
  });

  it("renders the FAQ and emits matching FAQPage structured data", () => {
    const { container } = render(<HostingPage />);

    // Every authored FAQ question is on the page for readers...
    for (const { q } of hostingCopy.faq) {
      expect(screen.getByText(q)).toBeInTheDocument();
    }

    // ...and mirrored as FAQPage JSON-LD so it can earn rich results / AI cites.
    const ldScripts = container.querySelectorAll(
      'script[type="application/ld+json"]',
    );
    const faq = [...ldScripts]
      .map((s) => JSON.parse(s.textContent ?? "{}"))
      .find((data) => data["@type"] === "FAQPage");

    expect(faq).toBeDefined();
    expect(faq.mainEntity).toHaveLength(hostingCopy.faq.length);
    expect(faq.mainEntity[0]).toMatchObject({
      "@type": "Question",
      name: hostingCopy.faq[0].q,
      acceptedAnswer: { "@type": "Answer", text: hostingCopy.faq[0].a },
    });
  });

  it("is indexable with on-topic hosting metadata", () => {
    expect(metadata.title).toBeTruthy();
    expect(metadata.description).toBeTruthy();
    expect(metadata.alternates?.canonical).toBe("/hosting");
    // Not opted out of indexing.
    expect(metadata.robots).toBeUndefined();
  });
});
