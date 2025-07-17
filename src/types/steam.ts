export interface SteamUserDetails {
  personaname: string;
}

export interface SteamGuideDetails {
  title: string;
  description: string;
  preview_url: string;
  views: number;
  lifetime_favorited: number;
}

export interface GetPublishedFileDetails {
  response: {
    publishedfiledetails: SteamGuideDetails[];
  };
}

export interface GetPlayerSummaries {
  response: {
    players: SteamUserDetails[];
  };
}

export interface SteamGuideResponse {
  guide: SteamGuideDetails;
  user: SteamUserDetails;
}

interface SteamGame {
  appid: number;
  playtime_forever: number;
  name?: string;
}

export interface SteamApiResponse {
  response: {
    games: SteamGame[];
    game_count?: number;
  };
}
