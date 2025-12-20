import { getCategories } from "@/data/categories";
import { getItems } from "@/data/items";
import { getHeroStats } from "@/data/stats";

import type {
  GetPlayerSummaries,
  GetPublishedFileDetails,
  SteamGuideDetails,
  SteamUserDetails,
} from "@/types/steam";
import { steamConfig } from "@/config/constants";

import { createTRPCRouter, publicProcedure } from "../trpc";

const STEAM_API_KEY = process.env.STEAM_API_KEY;

async function fetchSteamUserDetails(): Promise<SteamUserDetails> {
  const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${STEAM_API_KEY}&steamids=${steamConfig.STEAM_ID}`;

  const res = await fetch(url, {
    next: {
      revalidate: 60 * 60 * 24, // 24 hours
      tags: ["steam-user"],
    },
  });
  const data: GetPlayerSummaries = await res.json();
  return data.response.players[0];
}

async function fetchGuideDetails(): Promise<SteamGuideDetails> {
  const url = `https://api.steampowered.com/ISteamRemoteStorage/GetPublishedFileDetails/v1/`;

  const body = new URLSearchParams({
    itemcount: "1",
    "publishedfileids[0]": steamConfig.GUIDE_ID,
  });
  const res = await fetch(url, {
    method: "POST",
    body,
    next: {
      revalidate: 60 * 60 * 24, // 24 hours
      tags: ["steam-guide"],
    },
  });
  const data: GetPublishedFileDetails = await res.json();
  return data.response.publishedfiledetails[0];
}

export const statsRouter = createTRPCRouter({
  getHero: publicProcedure.query(async () => {
    return getHeroStats();
  }),

  getCategories: publicProcedure.query(async () => {
    return getCategories();
  }),

  getItems: publicProcedure.query(async () => {
    return getItems();
  }),

  getSteamGuide: publicProcedure.query(async () => {
    if (!STEAM_API_KEY) {
      throw new Error("Steam API key is not set");
    }

    if (!process.env.STEAM_ID) {
      throw new Error("Steam ID is not set");
    }

    const [guideResponse, userDetailsResponse] = await Promise.all([
      fetchGuideDetails(),
      fetchSteamUserDetails(),
    ]);

    const guide = {
      title: guideResponse.title,
      description: guideResponse.description,
      preview_url: guideResponse.preview_url,
      views: guideResponse.views,
      lifetime_favorited: guideResponse.lifetime_favorited,
    };
    const user = {
      personaname: userDetailsResponse.personaname,
    };

    return { guide, user };
  }),
});
