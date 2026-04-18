import { Metadata } from "next";
import { PricingTable } from "@clerk/nextjs";

import { siteConfig } from "@/config/site";
import { Separator } from "@/components/ui/separator";
import { PricingCards } from "@/components/donate/pricing-cards";
import { DonateButton } from "@/components/features/donation/donate-button";
import { DonateFeature } from "@/components/features/donation/donate-feature";
import { DonateOtherLinks } from "@/components/features/donation/donate-other-links";
import { DonateSupporterPerks } from "@/components/features/donation/donate-supporter-perks";
import { Icons } from "@/components/shared/icons";
import { Typography } from "@/components/shared/typography";

const paynowEnabled = process.env.NEXT_PUBLIC_PAYNOW_ENABLED === "true";

export const metadata: Metadata = {
  title: "Support the Project and Go Ad-Free",
  description:
    "Subscribe for $3/month to enjoy an ad-free experience, get a Supporter badge, and help keep Rust Conveyor Filters running.",
};

const { buyMeACoffee, kofi, patreon } = siteConfig.donate;

export default function DonatePage() {
  return (
    <div className='relative isolate py-16'>
      <div className='mx-auto flex max-w-3xl flex-col items-center bg-background/5 px-6 py-16 ring-1 ring-foreground/10 sm:rounded-3xl'>
        <Typography variant='h1' className='text-center sm:text-5xl'>
          Keep {siteConfig.name} Free for Everyone
        </Typography>

        <div className='mt-6 max-w-2xl text-center'>
          <Typography variant='p' className='text-lg leading-8'>
            Your support covers server costs and fuels development. In return,
            enjoy a cleaner, ad-free experience.
          </Typography>
        </div>

        <DonateSupporterPerks />

        <div className='mt-10 flex w-full max-w-2xl flex-col items-center text-center'>
          <Typography
            variant='h2'
            className='mt-0 border-b-0 pb-0 text-2xl font-semibold'
          >
            Choose your monthly support plan
          </Typography>
          <Typography variant='mutedText' className='mt-2 mb-6 leading-7'>
            Subscribe to browse ad-free, pick up the Supporter badge, and help
            fund continued updates.
          </Typography>
          {paynowEnabled ? <PricingCards /> : <PricingTable />}
        </div>

        <div className='mt-6 max-w-2xl'>
          <Typography
            variant='h2'
            className='mt-6 border-b-0 pb-0 text-xl font-semibold'
          >
            Here&apos;s how your contribution will be used:
          </Typography>

          <DonateFeature />
        </div>

        <Separator className='mt-10' />
        <Typography
          variant='h2'
          className='mt-6 border-b-0 pb-0 text-xl font-semibold'
        >
          Prefer a one-time donation?
        </Typography>
        <Typography variant='mutedText' className='mt-2 text-center'>
          One-time donations also earn the Donator badge. The ad-free experience
          is exclusive to active subscribers.
        </Typography>
        <Typography variant='mutedText' className='mt-1 text-center text-sm'>
          Discord Nitro Boosters also receive the Supporter badge and ad-free
          browsing while their boost stays active.
        </Typography>

        <ul
          role='list'
          className='mt-6 grid grid-cols-1 gap-x-8 gap-y-3 md:grid-cols-2'
        >
          <DonateButton
            href={buyMeACoffee}
            platform='buyMeACoffee'
            className='bg-[#FFDD00] font-semibold text-[#0D0C22] transition-colors hover:bg-[#FFDD00]/90'
            icon={<Icons.buymeacoffee className='h-5 w-5' />}
          >
            Buy me a coffee
          </DonateButton>
          <DonateButton
            href={kofi}
            platform='kofi'
            className='border-spacing-96 bg-[#72A5F2] font-semibold text-[#202020] shadow-[1px_1px_0px_rgba(0,0,0,0.2)] transition-colors hover:bg-[#72A5F2]/90'
            icon={<Icons.kofi className='h-5 w-5 animate-kofi-wiggle' />}
          >
            Support me on Ko-fi
          </DonateButton>
          <DonateButton
            href={patreon}
            platform='patreon'
            className='bg-[#FC674D] font-semibold text-[#202020] shadow-[1px_1px_0px_rgba(0,0,0,0.2)] transition-colors hover:bg-[#FC674D]/90'
            icon={<Icons.patreon className='h-5 w-5' />}
          >
            Support me on Patreon
          </DonateButton>
        </ul>

        <Separator className='mt-10' />
        <Typography
          variant='h2'
          className='mt-6 border-b-0 pb-0 text-xl font-semibold'
        >
          Other ways to support the creator
        </Typography>

        <DonateOtherLinks />
      </div>
      <div
        aria-hidden='true'
        className='absolute inset-x-0 -top-16 -z-10 flex transform-gpu justify-center overflow-hidden blur-3xl'
      >
        <div
          style={{
            clipPath:
              "polygon(73.6% 51.7%, 91.7% 11.8%, 100% 46.4%, 97.4% 82.2%, 92.5% 84.9%, 75.7% 64%, 55.3% 47.5%, 46.5% 49.4%, 45% 62.9%, 50.3% 87.2%, 21.3% 64.1%, 0.1% 100%, 5.4% 51.1%, 21.4% 63.9%, 58.9% 0.2%, 73.6% 51.7%)",
          }}
          className='aspect-1108/632 w-277 bg-linear-to-r from-[#4cc9f0] to-[#4361ee] opacity-20'
        />
      </div>
    </div>
  );
}
