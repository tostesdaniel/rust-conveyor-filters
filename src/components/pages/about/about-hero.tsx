import Image from "next/image";

import type { SteamApiResponse } from "@/types/steam";
import { steamConfig } from "@/config/constants";
import { AboutSocialLinks } from "@/components/pages/about/about-social-links";
import { Typography } from "@/components/shared/typography";

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
            Hey there! I&apos;m Daniel, also known as <strong>ohTostt</strong>{" "}
            in the gaming world. With over{" "}
            <strong>{gameHours || "too many"}</strong> hours in Rust, I came to
            a conclusion that I&apos;ve spent too much time setting up filters
            than actually playing the game. That&apos;s when the idea of{" "}
            <strong>Rust Conveyor Filters</strong> was born.
          </Typography>
          <Typography variant='p' className='text-lg leading-8'>
            What started as an idea to help myself save time, quickly turned
            into something greater. I shared it with my friends and they loved
            it! With their feedback, I was able to improve the app and make it
            better before sharing it with the community.
          </Typography>
          <Typography variant='p' className='text-lg leading-8'>
            My favorite part about this project is the community. I&apos;ve
            received so much support and it&apos;s been a great experience to be
            a part of it. Also, the idea of turning this idea into a reality is
            something that I&apos;m really proud of, and it reignited my passion
            for programming.
          </Typography>
          <Typography variant='p' className='text-lg leading-8'>
            As for Rust, I still play it, but not as much as I used to. Usually
            I hop on for a day to snowball with my friends and have a good time.
            As a developer, my goal is to make this app better each day, with
            the help of this community that supported it from the start. Thank
            you all! ❤️
          </Typography>

          <AboutSocialLinks />
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
