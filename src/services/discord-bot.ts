import { clerkClient } from "@clerk/nextjs/server";

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const USER_COUNT_CHANNEL_ID = process.env.DISCORD_USER_COUNT_CHANNEL_ID;

export async function updateUserCountChannel() {
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
