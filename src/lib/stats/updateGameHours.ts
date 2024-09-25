import { kv } from "@vercel/kv";

import { steamConfig } from "@/lib/constants";

const STEAM_API_KEY = process.env.STEAM_API_KEY;
const STEAM_ID = steamConfig.STEAM_ID;
const RUST_APP_ID = 252490;

export async function updateGameHours() {
  const url = `http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${STEAM_API_KEY}&steamid=${STEAM_ID}&format=json`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json();
    const gameHours = Math.floor(
      data.response.games.find((game: any) => game.appid === RUST_APP_ID)
        .playtime_forever / 60,
    );
    await kv.set("gameHours", gameHours);
    return gameHours;
  } catch (error) {
    console.error("Error updating game hours:", error);
    throw error;
  }
}
