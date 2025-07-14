import { steamConfig } from "@/config/constants";
import { getRedisClient } from "@/lib/redis";

interface SteamGame {
  appid: number;
  playtime_forever: number;
  name?: string;
}

interface SteamApiResponse {
  response: {
    games: SteamGame[];
    game_count?: number;
  };
}

const STEAM_API_KEY = process.env.STEAM_API_KEY;
const STEAM_ID = steamConfig.STEAM_ID;
const RUST_APP_ID = 252490;

export async function updateGameHours() {
  const url = `http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${STEAM_API_KEY}&steamid=${STEAM_ID}&format=json`;

  try {
    const redis = await getRedisClient();
    const res = await fetch(url, { cache: "no-store" });
    const data: SteamApiResponse = await res.json();
    const gameHours = Math.floor(
      (data.response.games.find((game) => game.appid === RUST_APP_ID)
        ?.playtime_forever ?? 0) / 60,
    );
    await redis.set("gameHours", gameHours);
    return gameHours;
  } catch (error) {
    console.error("Error updating game hours:", error);
    throw error;
  }
}
