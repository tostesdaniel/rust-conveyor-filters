import "server-only";

import { clerkUserToAuthorDisplay } from "@/utils/enrich-filter";
import { clerkClient, type User } from "@clerk/nextjs/server";

import { DISCORD_GUILD_ID } from "@/config/constants";
import { getRedisClient } from "@/lib/redis";

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const USER_COUNT_CHANNEL_ID = process.env.DISCORD_USER_COUNT_CHANNEL_ID;
const FEEDBACK_CHANNEL_ID = process.env.DISCORD_FEEDBACK_CHANNEL_ID;
const CLERK_DASHBOARD_USER_URL_PREFIX =
  process.env.CLERK_DASHBOARD_USER_URL_PREFIX;
const SUBSCRIBER_ROLE_ID = "1487307098617286817";

function clerkDashboardProfileUrl(clerkUserId: string): string | null {
  const raw = CLERK_DASHBOARD_USER_URL_PREFIX?.trim();
  if (!raw) {
    return null;
  }
  const base = raw.replace(/\/+$/, "");
  return `${base}/${clerkUserId}`;
}

const DISCORD_EMBED_DISPLAY_NAME_MAX = 250;

function safeDiscordMarkdownLinkLabel(raw: string): string {
  return truncateDiscordDisplayName(
    raw.replace(/\\/g, "").replace(/\[/g, "").replace(/\]/g, ""),
  );
}

function truncateDiscordDisplayName(name: string): string {
  if (name.length <= DISCORD_EMBED_DISPLAY_NAME_MAX) {
    return name;
  }
  return `${name.slice(0, DISCORD_EMBED_DISPLAY_NAME_MAX - 1)}\u2026`;
}

function markdownProfileLink(displayName: string, profileUrl: string): string {
  const label = safeDiscordMarkdownLinkLabel(displayName);
  return `[${label}](${profileUrl})`;
}

function feedbackSubmitterDisplayName(user: User): string {
  const primary = clerkUserToAuthorDisplay(user);
  if (primary) {
    return primary;
  }
  const first = user.firstName?.trim();
  const last = user.lastName?.trim();
  if (first && last) {
    return `${first} ${last}`;
  }
  if (first) {
    return first;
  }
  if (user.username) {
    return user.username;
  }
  const email = user.primaryEmailAddress?.emailAddress;
  if (email) {
    const local = email.split("@")[0];
    if (local.length > 0) {
      return local;
    }
  }
  return user.id;
}

async function resolveFeedbackSubmitterDisplayName(
  clerkUserId: string,
): Promise<string> {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(clerkUserId);
    return feedbackSubmitterDisplayName(user);
  } catch {
    return clerkUserId;
  }
}

const FEEDBACK_TYPE_LABEL = {
  bug: "Bug",
  feature: "Feature",
  general: "General",
} as const;

const FEEDBACK_DISCORD_EMBED_COLOR = 0x34_83_e0;

export type FeedbackDiscordPayload = {
  authorId: string;
  feedback: string;
  feedbackType: keyof typeof FEEDBACK_TYPE_LABEL;
  rating: "1" | "2" | "3" | "4" | "5";
};

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

/** Posts new website feedback to Discord */
export async function notifyFeedbackSubmission(
  payload: FeedbackDiscordPayload,
): Promise<void> {
  if (!DISCORD_TOKEN || !FEEDBACK_CHANNEL_ID) {
    return;
  }

  try {
    const profileUrl = clerkDashboardProfileUrl(payload.authorId);
    const displayName = await resolveFeedbackSubmitterDisplayName(
      payload.authorId,
    );

    const typeAndRating = `**Type** ${FEEDBACK_TYPE_LABEL[payload.feedbackType]} · **Rating** ${payload.rating}/5`;
    const headerAndMessage = `${typeAndRating}\n\n**Message**\n${payload.feedback}`;

    let description: string;
    let footerText: string | undefined;

    if (profileUrl) {
      description = `${headerAndMessage}\n\n${markdownProfileLink(
        displayName,
        profileUrl,
      )}`;
    } else {
      description = headerAndMessage;
      footerText = `User ID: ${payload.authorId}`;
    }

    const embed: {
      color: number;
      title: string;
      description: string;
      footer?: { text: string };
      timestamp: string;
    } = {
      color: FEEDBACK_DISCORD_EMBED_COLOR,
      title: "New feedback",
      description,
      timestamp: new Date().toISOString(),
    };

    if (footerText !== undefined) {
      embed.footer = { text: footerText };
    }

    const response = await fetch(
      `https://discord.com/api/v10/channels/${FEEDBACK_CHANNEL_ID}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bot ${DISCORD_TOKEN}`,
        },
        body: JSON.stringify({
          embeds: [embed],
        }),
      },
    );

    if (!response.ok) {
      throw new Error(
        `Discord feedback notification failed: ${await response.text()}`,
      );
    }
  } catch (error) {
    console.error("Discord feedback notification failed:", error);
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
