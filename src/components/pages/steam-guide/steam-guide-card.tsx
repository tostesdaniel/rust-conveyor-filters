import Image from "next/image";
import { api } from "@/trpc/server";
import { parseDescription } from "@/utils/parse-steam-guide";
import { ArrowRightIcon, BookHeartIcon, EyeIcon, StarIcon } from "lucide-react";
import millify from "millify";

import { steamConfig } from "@/config/constants";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Typography } from "@/components/shared/typography";

export async function SteamGuideCard() {
  const { guide, user } = await api.stats.getSteamGuide();

  const previewUrl =
    guide.preview_url ||
    "https://images.steamusercontent.com/ugc/2407823090587833568/565887E3C1B64A41F9CD1F1EE8ADBE3C241823FE/?imw=128&imh=128&ima=fit&impolicy=Letterbox&imcolor=%23000000&letterbox=true";

  const stars = [...Array(5)].map((_, i) => (
    <StarIcon
      key={i}
      className='size-4 text-green-500'
      fill={i < 4 ? "currentColor" : "none"}
    />
  ));

  return (
    <Card className='mx-auto mt-6 max-w-3xl rounded-none sm:rounded-lg'>
      <CardHeader className='grid grid-cols-2 sm:flex sm:flex-row sm:gap-x-5'>
        <Image
          src={previewUrl}
          alt={guide.title}
          width={80}
          height={80}
          className='size-20 sm:max-w-20'
        />

        <div className='flex h-4 items-center gap-x-0.5 self-start justify-self-end sm:hidden'>
          {stars}
        </div>
        <div className='col-span-2 sm:flex-1'>
          <div className='sm:flex sm:items-start sm:justify-between sm:gap-x-5'>
            <div>
              <CardTitle>{guide.title}</CardTitle>
              <CardDescription>Created by {user.personaname}</CardDescription>
            </div>
            <div className='hidden h-4 items-center gap-x-0.5 sm:flex'>
              {stars}
            </div>
          </div>
          <Separator className='mt-1.5' />
        </div>
      </CardHeader>
      <CardContent className='sm:mx-20'>
        {parseDescription(guide.description)}
      </CardContent>
      <CardFooter className='justify-between'>
        <div className='flex items-center gap-x-2'>
          <div className='flex items-center gap-x-1'>
            <EyeIcon className='size-4 text-muted-foreground' />
            <Typography variant='mutedText'>
              {millify(guide.views)} views
            </Typography>
          </div>
          <div className='flex items-center gap-x-1'>
            <BookHeartIcon className='size-4 text-muted-foreground' />
            <Typography variant='mutedText'>
              {millify(guide.lifetime_favorited)} favorites
            </Typography>
          </div>
        </div>
        <div>
          <a
            href={steamConfig.GUIDE_URL}
            target='_blank'
            rel='noopener noreferrer'
            className={buttonVariants({ variant: "link" })}
          >
            Read more
            <ArrowRightIcon className='-mb-1 size-3' />
          </a>
        </div>
      </CardFooter>
    </Card>
  );
}
