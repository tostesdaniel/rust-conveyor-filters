import { ExternalLinkIcon } from "lucide-react";

import { steamConfig } from "@/lib/constants";
import { Typography } from "@/components/ui/typography";
import { SteamGuideCard } from "@/components/steam-guide/steam-guide-card";

export default function SteamGuidePage() {
  return (
    <div className='flex flex-col items-center justify-center'>
      <Typography variant='h1' className='max-w-md text-center sm:max-w-none'>
        Check out the Steam Guide
        <a
          href={steamConfig.GUIDE_URL}
          target='_blank'
          rel='noopener noreferrer'
          className='inline-flex text-blue-400 transition-colors hover:text-blue-500'
        >
          <ExternalLinkIcon className='ml-2 h-6 w-6' />
        </a>
      </Typography>
      <SteamGuideCard />
    </div>
  );
}
