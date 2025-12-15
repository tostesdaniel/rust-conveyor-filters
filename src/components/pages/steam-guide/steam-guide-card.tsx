import Image from "next/image";
import { api } from "@/trpc/server";
import { parseDescription } from "@/utils/parse-steam-guide";
import { ArrowRightIcon, BookHeartIcon, EyeIcon, StarIcon } from "lucide-react";
import millify from "millify";

import { steamConfig } from "@/config/constants";
import { Button } from "@/components/ui/button";
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

  return (
    <Card className='mx-auto mt-6 max-w-3xl rounded-none sm:rounded-lg'>
      <CardHeader className='grid grid-cols-2 sm:flex sm:flex-row'>
        <Image
          src={previewUrl}
          alt={guide.title}
          width={80}
          height={80}
          className='h-20 w-20 sm:max-w-20'
        />
        <div className='self-start justify-self-end sm:order-3 sm:flex sm:flex-1 sm:flex-col sm:justify-between sm:self-auto'>
          <div className='flex h-4 items-center gap-x-0.5'>
            {[...Array(5)].map((_, i) => (
              <StarIcon
                key={i}
                className='h-4 w-4 text-green-500'
                fill={i < 4 ? "currentColor" : "none"}
              />
            ))}
          </div>
          <Separator className='hidden sm:block' />
        </div>
        <div className='col-span-2 sm:ml-4'>
          <CardTitle>{guide.title}</CardTitle>
          <CardDescription>Created by {user.personaname}</CardDescription>
          <Separator className='mt-1.5' />
        </div>
      </CardHeader>
      <CardContent className='sm:mx-20'>
        {parseDescription(guide.description)}
      </CardContent>
      <CardFooter className='justify-between'>
        <div className='flex items-center space-x-2'>
          <div className='flex items-center gap-x-1'>
            <EyeIcon className='h-4 w-4 text-muted-foreground' />
            <Typography variant='mutedText'>
              {millify(guide.views)} views
            </Typography>
          </div>
          <div className='flex items-center gap-x-1'>
            <BookHeartIcon className='h-4 w-4 text-muted-foreground' />
            <Typography variant='mutedText'>
              {millify(guide.lifetime_favorited)} favorites
            </Typography>
          </div>
        </div>
        <div>
          <Button asChild variant='link'>
            <a
              href={steamConfig.GUIDE_URL}
              target='_blank'
              rel='noopener noreferrer'
            >
              Read more
              <ArrowRightIcon className='-mb-1 h-3 w-3' />
            </a>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
