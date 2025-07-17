import Image from "next/image";
import { LinkedinIcon } from "lucide-react";

import type { SteamApiResponse } from "@/types/steam";
import { steamConfig } from "@/config/constants";
import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/shared/icons";
import { Typography } from "@/components/shared/typography";

const { links } = siteConfig;

const STEAM_API_KEY = process.env.STEAM_API_KEY;
const STEAM_ID = steamConfig.STEAM_ID;
const RUST_APP_ID = 252490;
const STEAM_OWNED_GAMES_URL = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${STEAM_API_KEY}&steamid=${STEAM_ID}&format=json`;

export async function AboutHero() {
  const data = await fetch(STEAM_OWNED_GAMES_URL, {
    next: { revalidate: 86400 }, // Cache for 1 day
  });
  const json: SteamApiResponse = await data.json();
  const gameHours = Math.floor(
    (json.response.games.find((game) => game.appid === RUST_APP_ID)
      ?.playtime_forever ?? 0) / 60,
  );

  return (
    <div className='py-16 lg:py-24'>
      <div className='mx-auto max-w-2xl lg:mx-0 lg:grid lg:max-w-none lg:grid-cols-2 lg:gap-x-16 lg:gap-y-6 xl:grid-cols-1 xl:grid-rows-1 xl:gap-x-8'>
        <Typography
          variant='h1'
          className='max-w-2xl sm:text-6xl lg:col-span-2 xl:col-auto'
        >
          Meet the creator
        </Typography>
        <div className='mt-6 max-w-xl lg:mt-0 xl:col-end-1 xl:row-start-1'>
          <Typography variant='p' className='text-lg leading-8'>
            Hi, I&apos;m <strong>Daniel</strong>, also known as{" "}
            <strong>ohTostt</strong> in the gaming world. I&apos;m a passionate{" "}
            <strong>software developer</strong> with a love for games, specially{" "}
            <strong>Rust</strong>, which I&apos;ve accumulated{" "}
            <strong>{gameHours ?? "many"} hours</strong>. Whether I&apos;m
            working on a new feature, fixing a bug, or just playing around with
            something new, I&apos;m always looking for the next challenge.
          </Typography>
          <div className='mt-10 flex items-center gap-x-6'>
            <Button asChild variant='outline'>
              <a
                href={links.linkedIn}
                target='_blank'
                rel='noopener noreferrer'
              >
                <LinkedinIcon /> Connect with me
              </a>
            </Button>
            <Button asChild variant='outline'>
              <a href={links.gitHub} target='_blank' rel='noopener noreferrer'>
                <Icons.gitHub /> Follow me
              </a>
            </Button>
          </div>
        </div>
        <Image
          src='/images/about-hero.webp'
          alt='Rust game character'
          quality={100}
          width={768}
          height={768}
          priority
          sizes='(max-width: 1024px) 512px, 768px'
          className='mt-10 aspect-square w-full max-w-lg rounded-2xl object-cover sm:mt-16 lg:mt-0 lg:max-w-none xl:row-span-2 xl:row-end-2 xl:mt-[84px]'
        />
      </div>
    </div>
  );
}
