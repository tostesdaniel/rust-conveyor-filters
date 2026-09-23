import { describe, expect, it, vi } from "vitest";

import {
  fetchBoostingDiscordIds,
  planBoosterChanges,
  type BoosterCandidate,
} from "@/services/server-boosters";

describe("planBoosterChanges", () => {
  const boosting = new Set(["discord-a"]);

  it("grants a linked user who is boosting", () => {
    const candidates: BoosterCandidate[] = [
      { clerkUserId: "user_a", discordUserId: "discord-a", isBooster: false },
    ];
    expect(planBoosterChanges(candidates, boosting)).toEqual([
      { clerkUserId: "user_a", isBooster: true },
    ]);
  });

  it("revokes a flagged user who stopped boosting", () => {
    const candidates: BoosterCandidate[] = [
      { clerkUserId: "user_b", discordUserId: "discord-b", isBooster: true },
    ];
    expect(planBoosterChanges(candidates, boosting)).toEqual([
      { clerkUserId: "user_b", isBooster: false },
    ]);
  });

  it("revokes a flagged user who unlinked Discord", () => {
    const candidates: BoosterCandidate[] = [
      { clerkUserId: "user_c", discordUserId: null, isBooster: true },
    ];
    expect(planBoosterChanges(candidates, boosting)).toEqual([
      { clerkUserId: "user_c", isBooster: false },
    ]);
  });

  it("leaves users whose flag already matches alone", () => {
    const candidates: BoosterCandidate[] = [
      { clerkUserId: "user_a", discordUserId: "discord-a", isBooster: true },
      { clerkUserId: "user_d", discordUserId: "discord-d", isBooster: false },
    ];
    expect(planBoosterChanges(candidates, boosting)).toEqual([]);
  });
});

describe("fetchBoostingDiscordIds", () => {
  const member = (id: string, premiumSince: string | null) => ({
    user: { id },
    premium_since: premiumSince,
  });

  it("pages with the last member id and keeps only boosters", async () => {
    const firstPage = Array.from({ length: 1000 }, (_, i) =>
      member(`${i + 1}`, i === 0 ? "2026-01-01T00:00:00Z" : null),
    );
    const secondPage = [member("1001", "2026-02-01T00:00:00Z")];
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(Response.json(firstPage))
      .mockResolvedValueOnce(Response.json(secondPage));

    const boosting = await fetchBoostingDiscordIds("token", fetchImpl);

    expect(boosting).toEqual(new Set(["1", "1001"]));
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(fetchImpl.mock.calls[1][0]).toContain("after=1000");
  });

  it("throws instead of returning an empty set when Discord fails", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(new Response("Missing Access", { status: 403 }));

    await expect(fetchBoostingDiscordIds("token", fetchImpl)).rejects.toThrow(
      "403",
    );
  });
});
