import Image from "next/image";
import { Redis } from "@upstash/redis";
import { LinkedinIcon } from "lucide-react";

import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { Typography } from "@/components/ui/typography";

const redis = Redis.fromEnv();

const { links } = siteConfig;

export async function AboutHero() {
  const gameHours = await redis.get<number>("gameHours");

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
