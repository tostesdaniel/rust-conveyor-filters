import { clerkUserToBadges } from "@/utils/enrich-filter";
import type { User } from "@clerk/nextjs/server";
import { describe, expect, it, vi } from "vitest";

import { BadgeType } from "@/types/badges";

vi.mock("@clerk/nextjs/server", () => ({ clerkClient: vi.fn() }));

const userWith = (publicMetadata: UserPublicMetadata) =>
  ({ publicMetadata }) as unknown as User;

describe("clerkUserToBadges", () => {
  it("gives a Server booster the Server Booster badge", () => {
    expect(clerkUserToBadges(userWith({ isServerBooster: true }))).toEqual([
      BadgeType.SERVER_BOOSTER,
    ]);
  });

  it("stacks Server Booster with Supporter", () => {
    expect(
      clerkUserToBadges(
        userWith({ isServerBooster: true, isSubscriber: true }),
      ),
    ).toEqual([BadgeType.SUPPORTER, BadgeType.SERVER_BOOSTER]);
  });

  it("stacks Server Booster with Donator", () => {
    expect(
      clerkUserToBadges(userWith({ isServerBooster: true, isDonator: true })),
    ).toEqual([BadgeType.DONATOR, BadgeType.SERVER_BOOSTER]);
  });

  it("keeps only Supporter for a subscriber who also donated", () => {
    expect(
      clerkUserToBadges(userWith({ isSubscriber: true, isDonator: true })),
    ).toEqual([BadgeType.SUPPORTER]);
  });
});
