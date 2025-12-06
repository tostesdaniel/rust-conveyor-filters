import "server-only";

import { clerkClient } from "@clerk/nextjs/server";

import { DISCORD_GUILD_ID } from "@/config/constants";

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const USER_COUNT_CHANNEL_ID = process.env.DISCORD_USER_COUNT_CHANNEL_ID;

export async function updateUserCountChannel() {
  if (!DISCORD_TOKEN || !USER_COUNT_CHANNEL_ID) {
    console.warn("Discord credentials not configured, skipping channel update");
    return;
  }

  try {
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
  } catch (error) {
    console.error("Failed to update user count:", error);
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
