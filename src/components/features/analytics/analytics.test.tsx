// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Analytics } from "./analytics";

// next/script injects after hydration, so render its props as a plain tag.
vi.mock("next/script", () => ({
  default: (props: Record<string, string>) => {
    const { strategy: _strategy, ...rest } = props;
    return <script {...rest} />;
  },
}));

afterEach(() => {
  vi.unstubAllEnvs();
});

function renderScript() {
  const { container } = render(<Analytics />);
  return container.querySelector("script");
}

describe("Analytics", () => {
  it("renders nothing outside production", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_RYBBIT_HOST", "https://sapo.example.com");

    expect(renderScript()).toBeNull();
  });

  it("renders nothing when the host is missing", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_RYBBIT_HOST", "");

    expect(renderScript()).toBeNull();
  });

  it("points at the host and tags the short commit", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_RYBBIT_HOST", "https://sapo.example.com");
    vi.stubEnv("NEXT_PUBLIC_COMMIT_SHA", "ecaec534a1b2c3d4e5f6");

    const script = renderScript();

    expect(script?.getAttribute("src")).toBe(
      "https://sapo.example.com/api/script.js",
    );
    expect(script?.getAttribute("data-site-id")).toBe("1");
    expect(script?.getAttribute("data-tag")).toBe("ecaec53");
    expect(
      JSON.parse(script?.getAttribute("data-mask-patterns") ?? ""),
    ).toEqual(["/my-filters/edit/*", "/auth/sign-in/**"]);
    expect(script?.hasAttribute("data-track-errors")).toBe(false);
  });

  it("leaves the tag off when the build has no commit", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_RYBBIT_HOST", "https://sapo.example.com");
    vi.stubEnv("NEXT_PUBLIC_COMMIT_SHA", undefined);

    expect(renderScript()?.hasAttribute("data-tag")).toBe(false);
  });
});
