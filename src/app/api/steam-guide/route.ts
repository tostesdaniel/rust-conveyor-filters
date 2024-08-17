import { NextResponse } from "next/server";

import type {
  GetPlayerSummaries,
  GetPublishedFileDetails,
  SteamGuideDetails,
  SteamUserDetails,
} from "@/types/steam";
import { steamConfig } from "@/lib/constants";

const STEAM_API_KEY = process.env.STEAM_API_KEY;

async function fetchSteamUserDetails(): Promise<SteamUserDetails> {
  const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${STEAM_API_KEY}&steamids=${steamConfig.STEAM_ID}`;

  const res = await fetch(url);
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
  });
  const data: GetPublishedFileDetails = await res.json();
  return data.response.publishedfiledetails[0];
}

export async function GET() {
  if (!STEAM_API_KEY) {
    return NextResponse.json(
      { error: "Steam API key is not set" },
      { status: 500 },
    );
  }

  if (!process.env.STEAM_ID) {
    return NextResponse.json({ error: "Steam ID is not set" }, { status: 500 });
  }

  try {
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

    return NextResponse.json({ guide, user }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Data currently unavailable" },
      { status: 500 },
    );
  }
}
