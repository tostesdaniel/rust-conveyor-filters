// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { siteConfig } from "@/config/site";

const DAY_MS = 24 * 60 * 60 * 1000;
const DAY_1 = new Date("2026-09-01T12:00:00Z").getTime();
const BOOST_TITLE = "Boost the server, lose the ads";
const LINKED_BODY =
  "Boosting our Discord keeps the Rust Conveyor Filters community going. While your boost lasts, the site is ad-free for you and your profile shows the Server Booster badge. It switches on within a minute.";
const UNLINKED_BODY =
  "Boost our Discord and the site goes ad-free for you, with the Server Booster badge on your profile. Connect Discord first so we can see your boost. It's under Manage account in your profile menu.";

// resetModules re-runs the mock factories, so they return hoisted fns the
// tests can keep a handle on.
const mocks = vi.hoisted(() => ({
  useUser: vi.fn(),
  openUserProfile: vi.fn(),
  usePathname: vi.fn(),
  useIsAdFree: vi.fn(),
  useAdblockDetected: vi.fn(),
  useAdblockCooldown: vi.fn(),
  trackEvent: vi.fn(),
}));

vi.mock("@clerk/nextjs", () => ({
  useUser: mocks.useUser,
  useClerk: () => ({ openUserProfile: mocks.openUserProfile }),
}));
vi.mock("next/navigation", () => ({ usePathname: mocks.usePathname }));
vi.mock("@/hooks/use-is-ad-free", () => ({ useIsAdFree: mocks.useIsAdFree }));
vi.mock("@/components/nitro/use-adblock-detected", () => ({
  useAdblockDetected: mocks.useAdblockDetected,
}));
vi.mock("@/hooks/use-adblock-cooldown", () => ({
  useAdblockCooldown: mocks.useAdblockCooldown,
}));
vi.mock("@/utils/rybbit", () => ({ trackEvent: mocks.trackEvent }));

type Audience = "anonymous" | "linked" | "unlinked";

function setAudience(audience: Audience) {
  if (audience === "anonymous") {
    mocks.useUser.mockReturnValue({
      isLoaded: true,
      isSignedIn: false,
      user: null,
    });
    return;
  }
  mocks.useUser.mockReturnValue({
    isLoaded: true,
    isSignedIn: true,
    user: {
      externalAccounts: audience === "linked" ? [{ provider: "discord" }] : [],
    },
  });
}

function seedEngagementScore(score: number) {
  localStorage.setItem(
    "engagement-score-v1",
    JSON.stringify({
      score,
      lastSessionDay: null,
      lastBannerShownAtScore: null,
      bannerDismissedAt: null,
      lastModalShownAtScore: null,
      modalDismissedAt: null,
    }),
  );
}

// Each call is a full page load, so resetModules wipes the session guards.
async function startSession(pathname = "/filters") {
  mocks.usePathname.mockReturnValue(pathname);
  vi.resetModules();
  const { Toaster } = await import("sonner");
  const { BannerWrapper } = await import("./banner-wrapper");
  const view = render(
    <>
      <Toaster />
      <BannerWrapper />
    </>,
  );
  await act(async () => {});
  return view;
}

// Sonner publishes toasts on a zero-delay timeout, so flush those too.
async function advance(ms: number) {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
  await act(async () => {
    vi.advanceTimersByTime(0);
  });
}

async function endSession(view: ReturnType<typeof render>) {
  view.unmount();
  const { toast } = await import("sonner");
  act(() => {
    toast.dismiss();
  });
}

function boostPrompt() {
  return screen.queryByText(BOOST_TITLE);
}

beforeEach(() => {
  // Sonner defers dismissals to requestAnimationFrame.
  vi.useFakeTimers({
    toFake: [
      "setTimeout",
      "clearTimeout",
      "setInterval",
      "clearInterval",
      "requestAnimationFrame",
      "cancelAnimationFrame",
      "Date",
    ],
  });
  vi.setSystemTime(DAY_1);
  localStorage.clear();
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));

  setAudience("linked");
  mocks.useIsAdFree.mockReturnValue(false);
  mocks.useAdblockDetected.mockReturnValue(false);
  mocks.useAdblockCooldown.mockReturnValue({
    inCooldown: false,
    markShown: vi.fn(),
  });
});

afterEach(async () => {
  // Sonner replays still-active toasts to the next Toaster that mounts.
  const { toast } = await import("sonner");
  toast.dismiss();
  vi.useRealTimers();
  vi.clearAllMocks();
});

// Day one only stamps firstSeenDay, so tests that want the prompt start on the
// next UTC day.
async function visitFirstDay() {
  const view = await startSession();
  await advance(6000);
  await endSession(view);
  vi.setSystemTime(DAY_1 + DAY_MS);
}

function dismissVia(control: "not-now" | "close") {
  const name = control === "not-now" ? "Not now" : "Close";
  fireEvent.click(screen.getByRole("button", { name }));
}

async function sessionShowsPrompt(pathname = "/filters") {
  const view = await startSession(pathname);
  await advance(6000);
  const shown = boostPrompt() !== null;
  return { view, shown };
}

async function expectHiddenThenShownAfterDays(from: number, days: number) {
  vi.setSystemTime(from + (days - 1) * DAY_MS);
  let session = await sessionShowsPrompt();
  expect(session.shown).toBe(false);
  await endSession(session.view);

  vi.setSystemTime(from + days * DAY_MS);
  session = await sessionShowsPrompt();
  expect(session.shown).toBe(true);
  return session.view;
}

describe("BannerWrapper boost prompt", () => {
  describe("audience", () => {
    it("never shows to anonymous visitors", async () => {
      setAudience("anonymous");
      await visitFirstDay();
      const { shown } = await sessionShowsPrompt();
      expect(shown).toBe(false);
    });

    it("never shows to ad-free users", async () => {
      mocks.useIsAdFree.mockReturnValue(true);
      await visitFirstDay();
      const { shown } = await sessionShowsPrompt();
      expect(shown).toBe(false);
    });
  });

  describe("where and when", () => {
    it("stays hidden off ad routes", async () => {
      await visitFirstDay();
      const { shown } = await sessionShowsPrompt("/donate");
      expect(shown).toBe(false);
    });

    it("shows on nested ad routes", async () => {
      await visitFirstDay();
      const { shown } = await sessionShowsPrompt("/my-filters/new-filter");
      expect(shown).toBe(true);
    });

    it("waits 6 seconds after load", async () => {
      await visitFirstDay();
      await startSession();

      await advance(5999);
      expect(boostPrompt()).not.toBeInTheDocument();
      await advance(1);
      expect(boostPrompt()).toBeInTheDocument();
    });

    it("skips the first eligible UTC day and shows from the next", async () => {
      let session = await sessionShowsPrompt();
      expect(session.shown).toBe(false);
      await endSession(session.view);

      // 23:00 UTC, still day one.
      vi.setSystemTime(DAY_1 + 11 * 60 * 60 * 1000);
      session = await sessionShowsPrompt();
      expect(session.shown).toBe(false);
      await endSession(session.view);

      vi.setSystemTime(DAY_1 + DAY_MS);
      session = await sessionShowsPrompt();
      expect(session.shown).toBe(true);
    });

    it("stays on screen until the user acts", async () => {
      await visitFirstDay();
      await sessionShowsPrompt();
      await advance(10 * 60 * 1000);
      expect(boostPrompt()).toBeInTheDocument();
    });
  });

  describe("variants", () => {
    it("links Discord users to the boost invite in a new tab", async () => {
      await visitFirstDay();
      await sessionShowsPrompt();

      expect(screen.getByText(LINKED_BODY)).toBeInTheDocument();
      const cta = screen.getByRole("link", { name: "Boost on Discord" });
      expect(cta).toHaveAttribute("href", siteConfig.links.discordBoost);
      expect(cta).toHaveAttribute("target", "_blank");
      expect(cta.getAttribute("rel")).toContain("noopener");
    });

    it("sends users without Discord to the account modal", async () => {
      setAudience("unlinked");
      await visitFirstDay();
      await sessionShowsPrompt();

      expect(screen.getByText(UNLINKED_BODY)).toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: "Boost on Discord" }),
      ).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Connect Discord" }));
      expect(mocks.openUserProfile).toHaveBeenCalledOnce();
    });

    it("announces itself as a polite status with a labelled close button", async () => {
      await visitFirstDay();
      await sessionShowsPrompt();

      const status = screen.getByRole("status", { name: BOOST_TITLE });
      expect(status).toHaveAccessibleDescription(LINKED_BODY);
      expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
    });

    it("sits in exactly one live region so it's announced once", async () => {
      await visitFirstDay();
      await sessionShowsPrompt();

      const isLive = (el: Element) => {
        const live = el.getAttribute("aria-live");
        if (live) return live !== "off";
        return ["status", "alert", "log"].includes(
          el.getAttribute("role") ?? "",
        );
      };
      let liveRegions = 0;
      let el: Element | null = screen.getByRole("status", {
        name: BOOST_TITLE,
      });
      while (el) {
        if (isLive(el)) liveRegions++;
        el = el.parentElement;
      }
      expect(liveRegions).toBe(1);
    });
  });

  describe("priority", () => {
    it("loses to the adblock appeal", async () => {
      await visitFirstDay();
      mocks.useAdblockDetected.mockReturnValue(true);
      await sessionShowsPrompt();

      expect(
        screen.getByText("Ads keep Rust Conveyor Filters free"),
      ).toBeInTheDocument();
      expect(boostPrompt()).not.toBeInTheDocument();
    });

    it("waits for the adblock check before claiming the session", async () => {
      await visitFirstDay();
      mocks.useAdblockDetected.mockReturnValue(null);
      const { shown } = await sessionShowsPrompt();
      expect(shown).toBe(false);
    });

    it("shows while the adblock appeal is cooling down", async () => {
      await visitFirstDay();
      mocks.useAdblockDetected.mockReturnValue(true);
      mocks.useAdblockCooldown.mockReturnValue({
        inCooldown: true,
        markShown: vi.fn(),
      });
      const { shown } = await sessionShowsPrompt();
      expect(shown).toBe(true);
    });

    it("loses to the upgrade modal", async () => {
      await visitFirstDay();
      seedEngagementScore(30);
      await sessionShowsPrompt();

      expect(
        screen.getByText("Enjoying Rust Conveyor Filters?"),
      ).toBeInTheDocument();
      expect(boostPrompt()).not.toBeInTheDocument();
    });

    it("beats the donate banner and holds the session", async () => {
      await visitFirstDay();
      seedEngagementScore(8);
      await startSession();

      await advance(5999);
      expect(screen.queryByText("Go Ad-Free")).not.toBeInTheDocument();
      await advance(1);
      expect(boostPrompt()).toBeInTheDocument();

      dismissVia("not-now");
      await advance(60 * 1000);
      expect(screen.queryByText("Go Ad-Free")).not.toBeInTheDocument();
    });

    it("stays away once another prompt had the session", async () => {
      await visitFirstDay();
      seedEngagementScore(8);
      const view = await startSession("/");
      await advance(6000);
      fireEvent.click(screen.getByRole("button", { name: "Maybe later" }));

      // Client navigation: same module state, new route.
      mocks.usePathname.mockReturnValue("/filters");
      const { BannerWrapper } = await import("./banner-wrapper");
      const { Toaster } = await import("sonner");
      view.rerender(
        <>
          <Toaster />
          <BannerWrapper />
        </>,
      );
      await advance(60 * 1000);
      expect(boostPrompt()).not.toBeInTheDocument();
    });
  });

  describe("other prompts", () => {
    it("shows the donate banner at once where the Boost prompt can't show", async () => {
      await visitFirstDay();
      seedEngagementScore(8);
      await startSession("/");
      expect(screen.getByText("Go Ad-Free")).toBeInTheDocument();
    });

    it("keeps the upgrade modal away after a dismissed adblock appeal", async () => {
      mocks.useAdblockDetected.mockReturnValue(true);
      await startSession();
      await advance(4000);
      expect(
        screen.getByText("Ads keep Rust Conveyor Filters free"),
      ).toBeInTheDocument();

      // SessionTick's writes fire this same event, so the modal comes due
      // mid-session.
      seedEngagementScore(30);
      act(() => {
        window.dispatchEvent(new Event("local-storage"));
      });
      // Showing the appeal starts its cooldown.
      mocks.useAdblockCooldown.mockReturnValue({
        inCooldown: true,
        markShown: vi.fn(),
      });
      fireEvent.click(screen.getByRole("button", { name: "Close" }));
      await advance(60 * 1000);
      expect(
        screen.queryByText("Enjoying Rust Conveyor Filters?"),
      ).not.toBeInTheDocument();
    });
  });

  describe("cadence", () => {
    it("backs off 7, 14, then 30 days after each dismissal", async () => {
      await visitFirstDay();
      const session = await sessionShowsPrompt();
      expect(session.shown).toBe(true);

      let answeredAt = Date.now();
      dismissVia("not-now");
      await endSession(session.view);
      let view = await expectHiddenThenShownAfterDays(answeredAt, 7);

      answeredAt = Date.now();
      dismissVia("close");
      await endSession(view);
      view = await expectHiddenThenShownAfterDays(answeredAt, 14);

      answeredAt = Date.now();
      dismissVia("not-now");
      await endSession(view);
      view = await expectHiddenThenShownAfterDays(answeredAt, 30);

      answeredAt = Date.now();
      dismissVia("close");
      await endSession(view);
      await expectHiddenThenShownAfterDays(answeredAt, 30);
    });

    it("counts a swipe as a dismissal", async () => {
      await visitFirstDay();
      const session = await sessionShowsPrompt();
      const answeredAt = Date.now();

      const toastEl = screen
        .getByText(BOOST_TITLE)
        .closest("[data-sonner-toast]") as HTMLElement;
      toastEl.setPointerCapture = vi.fn();
      toastEl.releasePointerCapture = vi.fn();
      fireEvent.pointerDown(toastEl, { clientX: 0, clientY: 0, pointerId: 1 });
      // The first move only locks the swipe axis.
      fireEvent.pointerMove(toastEl, {
        clientX: 0,
        clientY: 100,
        pointerId: 1,
      });
      fireEvent.pointerMove(toastEl, {
        clientX: 0,
        clientY: 200,
        pointerId: 1,
      });
      fireEvent.pointerUp(toastEl, { clientX: 0, clientY: 200, pointerId: 1 });
      await advance(1000);

      expect(mocks.trackEvent).toHaveBeenCalledWith("boost_prompt_dismissed", {
        variant: "linked",
      });
      await endSession(session.view);
      await expectHiddenThenShownAfterDays(answeredAt, 7);
    });

    it("snoozes 30 days after a click without advancing the dismiss ladder", async () => {
      await visitFirstDay();
      const session = await sessionShowsPrompt();

      let answeredAt = Date.now();
      fireEvent.click(screen.getByRole("link", { name: "Boost on Discord" }));
      await endSession(session.view);
      const view = await expectHiddenThenShownAfterDays(answeredAt, 30);

      answeredAt = Date.now();
      dismissVia("not-now");
      await endSession(view);
      await expectHiddenThenShownAfterDays(answeredAt, 7);
    });

    it("comes back next session when left unanswered", async () => {
      await visitFirstDay();
      const first = await sessionShowsPrompt();
      expect(first.shown).toBe(true);
      await endSession(first.view);

      const second = await sessionShowsPrompt();
      expect(second.shown).toBe(true);
    });

    it("treats throwing storage as not due", async () => {
      await visitFirstDay();
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("SecurityError");
      });
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("SecurityError");
      });
      // usehooks-ts warns when it can't read the engagement score.
      vi.spyOn(console, "warn").mockImplementation(() => {});

      const { shown } = await sessionShowsPrompt();
      expect(shown).toBe(false);
      vi.restoreAllMocks();
    });
  });

  describe("analytics", () => {
    it("tracks shown and dismissed with the variant", async () => {
      setAudience("unlinked");
      await visitFirstDay();
      await sessionShowsPrompt();
      expect(mocks.trackEvent).toHaveBeenCalledWith("boost_prompt_shown", {
        variant: "unlinked",
      });

      dismissVia("close");
      expect(mocks.trackEvent).toHaveBeenCalledWith("boost_prompt_dismissed", {
        variant: "unlinked",
      });
      expect(mocks.trackEvent).not.toHaveBeenCalledWith(
        "boost_prompt_clicked",
        expect.anything(),
      );
    });

    it("tracks a click once, not as a dismissal", async () => {
      await visitFirstDay();
      await sessionShowsPrompt();

      fireEvent.click(screen.getByRole("link", { name: "Boost on Discord" }));
      // The first pass queues Sonner's 200ms exit timer.
      await advance(1000);
      await advance(1000);

      const boostEvents = mocks.trackEvent.mock.calls.filter(([name]) =>
        String(name).startsWith("boost_prompt_"),
      );
      expect(boostEvents).toEqual([
        ["boost_prompt_shown", { variant: "linked" }],
        ["boost_prompt_clicked", { variant: "linked" }],
      ]);
      expect(boostPrompt()).not.toBeInTheDocument();
    });
  });
});
