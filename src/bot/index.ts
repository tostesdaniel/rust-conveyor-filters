import { syncServerBooster } from "@/services/server-boosters";
import { createClerkClient } from "@clerk/backend";
import { Client, Events, GatewayIntentBits, Partials } from "discord.js";

import { DISCORD_GUILD_ID } from "@/config/constants";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

const discordToken = requireEnv("DISCORD_TOKEN");
const clerk = createClerkClient({ secretKey: requireEnv("CLERK_SECRET_KEY") });

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
  // Leaves for members missing from the cache only arrive as partials.
  partials: [Partials.GuildMember],
});

async function onBoostChange(discordUserId: string, isBoosting: boolean) {
  try {
    await syncServerBooster(clerk, discordUserId, isBoosting);
  } catch (error) {
    // The site's hourly sync retries this, so a failure here only costs time.
    console.error(`bot: booster sync failed for ${discordUserId}`, error);
  }
}

client.once(Events.ClientReady, async (ready) => {
  // Filling the cache up front is what gives GuildMemberUpdate a real
  // oldMember to diff premiumSince against.
  const guild = await ready.guilds.fetch(DISCORD_GUILD_ID);
  await guild.members.fetch();
  console.log(
    `bot: ready as ${ready.user.tag}, cached ${guild.members.cache.size} members`,
  );
});

client.on(Events.GuildMemberUpdate, (oldMember, newMember) => {
  if (newMember.guild.id !== DISCORD_GUILD_ID) return;
  if (
    !oldMember.partial &&
    oldMember.premiumSinceTimestamp === newMember.premiumSinceTimestamp
  ) {
    return;
  }
  void onBoostChange(newMember.id, newMember.premiumSince !== null);
});

client.on(Events.GuildMemberRemove, (member) => {
  if (member.guild.id !== DISCORD_GUILD_ID) return;
  void onBoostChange(member.id, false);
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    void client.destroy().finally(() => process.exit(0));
  });
}

await client.login(discordToken);
