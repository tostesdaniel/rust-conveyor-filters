export enum FilterSettingsFieldDescription {
  MAX = "Stop transferring once we have this many of this item in the target container. Set to 0 to transfer as many as possible.",
  BUFFER = "Start transferring when this amount is in the container and transfer that amount exactly.",
  MIN = "Only transfer if there is this amount in the input container.",
}

export const MAX_FILTER_ITEMS = 30;

const STEAM_GUIDE_ID = "3308184949";
export const steamConfig = {
  GUIDE_ID: STEAM_GUIDE_ID,
  GUIDE_URL: `https://steamcommunity.com/sharedfiles/filedetails/?id=${STEAM_GUIDE_ID}`,
  STEAM_ID: process.env.STEAM_ID,
};

export const DISCORD_GUILD_ID = "1272807564693995520";

export const ITEM_CATEGORIES = [
  "Weapons",
  "Construction",
  "Items",
  "Resources",
  "Clothing",
  "Tools",
  "Medical",
  "Food",
  "Ammo",
  "Traps",
  "Other",
  "Components",
  "Electrical",
  "Fun",
] as const;
