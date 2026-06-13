import type { Metadata } from "next";
import { ExternalLinkIcon } from "lucide-react";

import { steamConfig } from "@/config/constants";
import { SteamGuideCard } from "@/components/pages/steam-guide/steam-guide-card";
import { Typography } from "@/components/shared/typography";

export const metadata: Metadata = {
  title: "Steam Guide",
  description:
    "Learn how to import and use Rust conveyor filters with the official Steam Guide.",
  alternates: { canonical: "/steam-guide" },
};

export const dynamic = "force-dynamic";

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
          <ExternalLinkIcon className='ml-2 size-6' />
        </a>
      </Typography>
      <SteamGuideCard />
    </div>
  );
}
