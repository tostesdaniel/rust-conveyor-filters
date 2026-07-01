// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { pineConfig } from "@/config/pine";
import { useIsAdFree } from "@/hooks/use-is-ad-free";

import { SidebarPromoCard } from "./sidebar-promo-card";
import { rollPineBucket } from "./pine-bucket";

// `useIsAdFree` wraps Clerk's `useUser`, which needs a provider; mock the hook
// so each test drives the audience split directly. `SidebarDonateCard` reads
// the same hook, so the donate branch stays consistent with the slot decision.
vi.mock("@/hooks/use-is-ad-free", () => ({ useIsAdFree: vi.fn() }));
const mockUseIsAdFree = vi.mocked(useIsAdFree);

// The per-visit roll caches at module scope; mock it so each test pins the
// non-ad-free visitor to a known bucket without depending on Math.random.
vi.mock("./pine-bucket", () => ({ rollPineBucket: vi.fn() }));
const mockRollPineBucket = vi.mocked(rollPineBucket);

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
  it("shows the donate card to non-supporters rolled out of the Pine bucket", () => {
    mockUseIsAdFree.mockReturnValue(false);
    mockRollPineBucket.mockReturnValue(false);
    render(<SidebarPromoCard />);

    const subscribe = screen.getByRole("link", { name: /subscribe/i });
    expect(subscribe).toHaveAttribute("href", "/donate");
    expect(
      screen.queryByText(pineConfig.copy.sidebar.heading),
    ).not.toBeInTheDocument();
  });

  it("shows the Pine card to non-supporters rolled into the bucket, tagged 'rolled'", () => {
    mockUseIsAdFree.mockReturnValue(false);
    mockRollPineBucket.mockReturnValue(true);
    render(<SidebarPromoCard />);

    const link = screen.getByRole("link", {
      name: pineConfig.copy.sidebar.ctaLabel,
    });
    expect(link).toHaveAttribute("href", "/hosting");
    expect(link).toHaveAttribute("data-umami-event-placement", "sidebar");
    expect(link).toHaveAttribute("data-umami-event-audience", "rolled");
    // The donate card is replaced, not stacked.
    expect(
      screen.queryByRole("link", { name: /subscribe/i }),
    ).not.toBeInTheDocument();
  });

  it("shows the Pine card to ad-free supporters, tagged 'adfree'", () => {
    mockUseIsAdFree.mockReturnValue(true);
    // Supporters see Pine regardless of the roll.
    mockRollPineBucket.mockReturnValue(false);
    render(<SidebarPromoCard />);

    const link = screen.getByRole("link", {
      name: pineConfig.copy.sidebar.ctaLabel,
    });
    // Internal link to /hosting, not an outbound affiliate URL.
    expect(link).toHaveAttribute("href", "/hosting");
    expect(link).not.toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("data-umami-event", "pine-click");
    expect(link).toHaveAttribute("data-umami-event-placement", "sidebar");
    expect(link).toHaveAttribute("data-umami-event-audience", "adfree");

    expect(
      screen.getByText(pineConfig.copy.sponsoredLabel),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /subscribe/i }),
    ).not.toBeInTheDocument();
  });

  it("renders nothing for ad-free supporters when disabled", () => {
    flags.enabled = false;
    mockUseIsAdFree.mockReturnValue(true);
    const { container } = render(<SidebarPromoCard />);

    expect(container).toBeEmptyDOMElement();
  });

  it("keeps non-supporters on the donate card when Pine is disabled", () => {
    flags.enabled = false;
    mockUseIsAdFree.mockReturnValue(false);
    // Even a winning roll must not show Pine while the partner is disabled.
    mockRollPineBucket.mockReturnValue(true);
    render(<SidebarPromoCard />);

    expect(
      screen.getByRole("link", { name: /subscribe/i }),
    ).toHaveAttribute("href", "/donate");
  });
});
