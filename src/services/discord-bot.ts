import "server-only";

import { clerkClient } from "@clerk/nextjs/server";

import { DISCORD_GUILD_ID } from "@/config/constants";
import { getRedisClient } from "@/lib/redis";

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const USER_COUNT_CHANNEL_ID = process.env.DISCORD_USER_COUNT_CHANNEL_ID;
const SUBSCRIBER_ROLE_ID = "1487307098617286817";

const USER_COUNT_THROTTLE_KEY = "discord-user-count-last-update";
const USER_COUNT_THROTTLE_MS = 305_000; // 5 minutes + 5 second buffer
const USER_LOOKUP_PAGE_SIZE = 100;

type DiscordExternalAccount = {
  provider?: string | null;
  providerUserId?: string | null;
};

export async function updateUserCountChannel() {
  if (!DISCORD_TOKEN || !USER_COUNT_CHANNEL_ID) {
    console.warn("Discord credentials not configured, skipping channel update");
    return;
  }

  try {
    const redis = await getRedisClient();
    const lastUpdate = await redis.get<number>(USER_COUNT_THROTTLE_KEY);
    const now = Date.now();

    if (lastUpdate && now - lastUpdate < USER_COUNT_THROTTLE_MS) {
      return;
    }

    const clerk = await clerkClient();
    const userCount = await clerk.users.getCount();

    const response = await fetch(
      `https://discord.com/api/v10/channels/${USER_COUNT_CHANNEL_ID}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bot ${DISCORD_TOKEN}`,
        },
        body: JSON.stringify({
          name: `🎉│Users: ${userCount}`,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to update channel: ${await response.text()}`);
    }

    await redis.set(USER_COUNT_THROTTLE_KEY, now);
  } catch (error) {
    console.error("Failed to update user count:", error);
  }
}

export async function addSubscriberRole(discordUserId: string) {
  if (!DISCORD_TOKEN) {
    console.warn("DISCORD_TOKEN not configured, skipping role assignment");
    return;
  }

  const response = await fetch(
    `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${discordUserId}/roles/${SUBSCRIBER_ROLE_ID}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bot ${DISCORD_TOKEN}`,
      },
    },
  );

  if (!response.ok && response.status !== 204) {
    throw new Error(`Failed to add subscriber role: ${await response.text()}`);
  }
}

export async function removeSubscriberRole(discordUserId: string) {
  if (!DISCORD_TOKEN) {
    console.warn("DISCORD_TOKEN not configured, skipping role removal");
    return;
  }

  const response = await fetch(
    `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${discordUserId}/roles/${SUBSCRIBER_ROLE_ID}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bot ${DISCORD_TOKEN}`,
      },
    },
  );

  if (!response.ok && response.status !== 204) {
    throw new Error(
      `Failed to remove subscriber role: ${await response.text()}`,
    );
  }
}

export async function getGuildMember(userId: string) {
  if (!DISCORD_TOKEN) {
    console.warn("DISCORD_TOKEN not configured, skipping guild member fetch");
    return null;
  }

  try {
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${userId}`,
      {
        headers: {
          Authorization: `Bot ${DISCORD_TOKEN}`,
        },
        next: { revalidate: 86400 }, // 24 hours
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch guild member: ${await response.text()}`);
    }

    const member = await response.json();

    // Prefer guild-specific avatar, fallback to user avatar
    const avatarHash = member.avatar || member.user.avatar;
    const avatarUrl = avatarHash
      ? (() => {
          const baseUrl = member.avatar
            ? `https://cdn.discordapp.com/guilds/${DISCORD_GUILD_ID}/users/${member.user.id}/avatars`
            : `https://cdn.discordapp.com/avatars/${member.user.id}`;
          return `${baseUrl}/${avatarHash}.png?size=40`;
        })()
      : null;

    return {
      name: member.nick || member.user.global_name,
      avatarUrl,
    };
  } catch (error) {
    console.error("Failed to fetch guild member:", error);
    return null;
  }
}

export async function findClerkUserIdByDiscordUserId(
  discordUserId: string,
): Promise<string | null> {
  const clerk = await clerkClient();
  const totalUsers = await clerk.users.getCount();

  for (let offset = 0; offset < totalUsers; offset += USER_LOOKUP_PAGE_SIZE) {
    const users = await clerk.users.getUserList({
      limit: USER_LOOKUP_PAGE_SIZE,
      offset,
    });

    const match = users.data.find((user) =>
      user.externalAccounts?.some(
        (account: DiscordExternalAccount) =>
          account.provider === "oauth_discord" &&
          account.providerUserId === discordUserId,
      ),
    );

    if (match) {
      return match.id;
    }

    if (users.data.length < USER_LOOKUP_PAGE_SIZE) {
      break;
    }
  }

  return null;
}
