// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PathnamePageviews } from "./pathname-pageviews";

const mocks = vi.hoisted(() => ({ usePathname: vi.fn() }));

vi.mock("next/navigation", () => ({ usePathname: mocks.usePathname }));

const pageview = vi.fn();

beforeEach(() => {
  window.rybbit = { pageview } as unknown as Window["rybbit"];
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("PathnamePageviews", () => {
  it("leaves the landing pageview to the script", () => {
    mocks.usePathname.mockReturnValue("/filters");
    render(<PathnamePageviews />);

    expect(pageview).not.toHaveBeenCalled();
  });

  it("sends one pageview per pathname change", () => {
    mocks.usePathname.mockReturnValue("/filters");
    const { rerender } = render(<PathnamePageviews />);

    mocks.usePathname.mockReturnValue("/my-filters");
    rerender(<PathnamePageviews />);
    mocks.usePathname.mockReturnValue("/filters");
    rerender(<PathnamePageviews />);

    expect(pageview).toHaveBeenCalledTimes(2);
  });

  it("ignores re-renders on the same pathname", () => {
    // Query-string writes re-render without changing the pathname.
    mocks.usePathname.mockReturnValue("/filters");
    const { rerender } = render(<PathnamePageviews />);

    rerender(<PathnamePageviews />);
    rerender(<PathnamePageviews />);

    expect(pageview).not.toHaveBeenCalled();
  });

  it("does nothing before the script has loaded", () => {
    window.rybbit = undefined as unknown as Window["rybbit"];
    mocks.usePathname.mockReturnValue("/filters");
    const { rerender } = render(<PathnamePageviews />);

    mocks.usePathname.mockReturnValue("/my-filters");
    expect(() => rerender(<PathnamePageviews />)).not.toThrow();
  });
});
