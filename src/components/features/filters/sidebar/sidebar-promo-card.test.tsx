// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { pineConfig } from "@/config/pine";
import { useIsAdFree } from "@/hooks/use-is-ad-free";

import { SidebarPromoCard } from "./sidebar-promo-card";

// `useIsAdFree` wraps Clerk's `useUser`, which needs a provider; mock the hook
// so each test drives the audience split directly. `SidebarDonateCard` reads
// the same hook, so the donate branch stays consistent with the slot decision.
vi.mock("@/hooks/use-is-ad-free", () => ({ useIsAdFree: vi.fn() }));
const mockUseIsAdFree = vi.mocked(useIsAdFree);

// Toggle pineConfig.enabled per test without touching the live config object.
const flags = vi.hoisted(() => ({ enabled: true }));
vi.mock("@/config/pine", async (importActual) => {
  const actual = await importActual<typeof import("@/config/pine")>();
  return {
    ...actual,
    pineConfig: {
      ...actual.pineConfig,
      get enabled() {
        return flags.enabled;
      },
    },
  };
});

afterEach(() => {
  flags.enabled = true;
  vi.clearAllMocks();
});

describe("SidebarPromoCard", () => {
  it("shows the unchanged donate card to non-supporters", () => {
    mockUseIsAdFree.mockReturnValue(false);
    render(<SidebarPromoCard />);

    const subscribe = screen.getByRole("link", { name: /subscribe/i });
    expect(subscribe).toHaveAttribute("href", "/donate");
    expect(
      screen.queryByText(pineConfig.copy.sidebar.heading),
    ).not.toBeInTheDocument();
  });

  it("shows the Pine card to ad-free supporters when enabled", () => {
    mockUseIsAdFree.mockReturnValue(true);
    render(<SidebarPromoCard />);

    const link = screen.getByRole("link", {
      name: pineConfig.copy.sidebar.ctaLabel,
    });
    // Internal link to /hosting, not an outbound affiliate URL.
    expect(link).toHaveAttribute("href", "/hosting");
    expect(link).not.toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("data-umami-event", "pine-click");
    expect(link).toHaveAttribute("data-umami-event-placement", "sidebar");

    expect(
      screen.getByText(pineConfig.copy.sponsoredLabel),
    ).toBeInTheDocument();
    // The donate card is not shown to supporters.
    expect(
      screen.queryByRole("link", { name: /subscribe/i }),
    ).not.toBeInTheDocument();
  });

  it("renders nothing for ad-free supporters when disabled", () => {
    flags.enabled = false;
    mockUseIsAdFree.mockReturnValue(true);
    const { container } = render(<SidebarPromoCard />);

    // Empty slot — no Pine card and no donate card for supporters.
    expect(container).toBeEmptyDOMElement();
  });
});
