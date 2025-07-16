import { Metadata } from "next";
import { Handshake, Trophy } from "lucide-react";

import { siteConfig } from "@/config/site";
import { Separator } from "@/components/ui/separator";
import { DonateBadgeShowcase } from "@/components/donate/donate-badge-showcase";
import { DonateButton } from "@/components/donate/donate-button";
import { DonateEmailReminder } from "@/components/donate/donate-email-reminder";
import { DonateFeature } from "@/components/donate/donate-feature";
import { ButtonWithIcon } from "@/components/shared/button-with-icon";
import { Icons } from "@/components/shared/icons";
import { Typography } from "@/components/shared/typography";

export const metadata: Metadata = {
  title: "Donate",
  description: "Support the development of the app",
};

const { buyMeACoffee, kofi, patreon } = siteConfig.donate;

export default function DonatePage() {
  return (
    <>
      <DonateEmailReminder />
      <div className='relative isolate py-16'>
        <div className='justify mx-auto flex max-w-3xl flex-col items-center bg-background/5 px-6 py-16 ring-1 ring-foreground/10 sm:rounded-3xl'>
          <Typography variant='h1' className='sm:text-5xl'>
            Support {siteConfig.name}
          </Typography>

          <div className='mt-6 max-w-2xl'>
            <Typography variant='p' className='text-lg leading-8'>
              Your support helps keep this project alive and growing!
            </Typography>
            <Typography variant='mutedText' className='text-lg leading-8'>
              Here&apos;s how your contribution will be used:
            </Typography>

            <DonateFeature />
          </div>

          <DonateBadgeShowcase />

          <ul
            role='list'
            className='mt-10 grid grid-cols-1 gap-x-8 gap-y-3 md:grid-cols-2'
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
          <Typography variant='h2' className='text-xl font-semibold'>
            Other ways to support the creator
          </Typography>

          <ul
            role='list'
            className='mt-6 grid grid-cols-1 gap-x-8 gap-y-3 md:grid-cols-2'
          >
            <ButtonWithIcon icon={Handshake}>
              <a
                href={siteConfig.donate.steamTradeOffer}
                target='_blank'
                rel='noopener noreferrer'
              >
                Send a trade offer
              </a>
            </ButtonWithIcon>
            <ButtonWithIcon icon={Trophy}>
              <a
                href={siteConfig.donate.steamAwardsPost}
                target='_blank'
                rel='noopener noreferrer'
              >
                Give a Steam Award
              </a>
            </ButtonWithIcon>
          </ul>
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
            className='aspect-1108/632 w-[69.25rem] bg-linear-to-r from-[#4cc9f0] to-[#4361ee] opacity-20'
          />
        </div>
      </div>
    </>
  );
}
