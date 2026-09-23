import type { ClerkClient, User } from "@clerk/backend";

import { DISCORD_GUILD_ID } from "@/config/constants";

// No "server-only" here: the gateway bot imports this outside Next.js, where
// that package throws on import.

const DISCORD_MEMBER_PAGE_SIZE = 1000;
const CLERK_USER_PAGE_SIZE = 500;

type DiscordGuildMember = {
  user: { id: string };
  premium_since: string | null;
};

export type BoosterCandidate = {
  clerkUserId: string;
  discordUserId: string | null;
  isBooster: boolean;
};

export type BoosterChange = {
  clerkUserId: string;
  isBooster: boolean;
};

export async function fetchBoostingDiscordIds(
  token: string,
  fetchImpl: typeof fetch = fetch,
): Promise<Set<string>> {
  const boosting = new Set<string>();
  let after = "0";

  for (;;) {
    const response = await fetchImpl(
      `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members?limit=${DISCORD_MEMBER_PAGE_SIZE}&after=${after}`,
      { headers: { Authorization: `Bot ${token}` } },
    );
    // Throwing matters: an empty member list would revoke every booster.
    if (!response.ok) {
      throw new Error(
        `Failed to list guild members: ${response.status} ${await response.text()}`,
      );
    }

    const members = (await response.json()) as DiscordGuildMember[];
    for (const member of members) {
      if (member.premium_since) boosting.add(member.user.id);
    }

    if (members.length < DISCORD_MEMBER_PAGE_SIZE) return boosting;
    after = members[members.length - 1].user.id;
  }
}

function discordUserIdOf(user: User): string | null {
  return (
    user.externalAccounts.find((account) => account.provider === "oauth_discord")
      ?.providerUserId ?? null
  );
}

// Keeps flagged users with no Discord link, so unlinking also revokes.
async function listBoosterCandidates(
  clerk: ClerkClient,
): Promise<BoosterCandidate[]> {
  const candidates: BoosterCandidate[] = [];

  for (let offset = 0; ; offset += CLERK_USER_PAGE_SIZE) {
    const { data } = await clerk.users.getUserList({
      limit: CLERK_USER_PAGE_SIZE,
      offset,
    });

    for (const user of data) {
      const discordUserId = discordUserIdOf(user);
      const isBooster = !!user.publicMetadata.isNitroBooster;
      if (discordUserId || isBooster) {
        candidates.push({ clerkUserId: user.id, discordUserId, isBooster });
      }
    }

    if (data.length < CLERK_USER_PAGE_SIZE) return candidates;
  }
}

export function planBoosterChanges(
  candidates: BoosterCandidate[],
  boosting: Set<string>,
): BoosterChange[] {
  return candidates.flatMap(({ clerkUserId, discordUserId, isBooster }) => {
    const shouldBoost = discordUserId !== null && boosting.has(discordUserId);
    return shouldBoost === isBooster
      ? []
      : [{ clerkUserId, isBooster: shouldBoost }];
  });
}

async function applyBoosterChanges(
  clerk: ClerkClient,
  changes: BoosterChange[],
) {
  for (const { clerkUserId, isBooster } of changes) {
    await clerk.users.updateUserMetadata(clerkUserId, {
      publicMetadata: { isNitroBooster: isBooster },
    });
    console.log(
      `boosters: ${isBooster ? "granted" : "revoked"} ad-free for ${clerkUserId}`,
    );
  }
}

export async function syncServerBoosters(
  clerk: ClerkClient,
  discordToken: string,
): Promise<BoosterChange[]> {
  const [boosting, candidates] = await Promise.all([
    fetchBoostingDiscordIds(discordToken),
    listBoosterCandidates(clerk),
  ]);
  const changes = planBoosterChanges(candidates, boosting);
  await applyBoosterChanges(clerk, changes);
  return changes;
}

/** Single-member version for gateway events; skips the guild member listing. */
export async function syncServerBooster(
  clerk: ClerkClient,
  discordUserId: string,
  isBoosting: boolean,
): Promise<BoosterChange[]> {
  const candidates = (await listBoosterCandidates(clerk)).filter(
    (candidate) => candidate.discordUserId === discordUserId,
  );
  const changes = planBoosterChanges(
    candidates,
    new Set(isBoosting ? [discordUserId] : []),
  );
  await applyBoosterChanges(clerk, changes);
  return changes;
}
