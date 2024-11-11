import { Metadata } from "next";

import { siteConfig } from "@/config/site";
import { Icons } from "@/components/ui/icons";
import { Typography } from "@/components/ui/typography";
import { DonateButton } from "@/components/donate/donate-button";

export const metadata: Metadata = {
  title: "Donate",
  description: "Support the development of the app",
};

const { buyMeACoffee, paypal, kofi } = siteConfig.donate;

export default function DonatePage() {
  return (
    <div className='relative isolate py-16 sm:py-24'>
      <div className='justify mx-auto flex max-w-3xl flex-col items-center bg-white/5 px-6 py-16 ring-1 ring-white/10 sm:rounded-3xl'>
        <Typography variant='h1' className='sm:text-5xl'>
          Support {siteConfig.name}
        </Typography>
        <Typography variant='p'>
          If you like the app, consider supporting the project!
        </Typography>
        <ul
          role='list'
          className='mt-10 grid grid-cols-1 gap-x-8 gap-y-3 md:grid-cols-3'
        >
          <DonateButton
            href={buyMeACoffee}
            platform='buyMeACoffee'
            className='bg-[#FFDD00] transition-colors hover:bg-[#FFDD00]/90'
            icon={<Icons.buymeacoffee className='h-5 w-5' />}
          >
            Buy me a coffee
          </DonateButton>
          <DonateButton
            href={paypal}
            platform='paypal'
            className='bg-[#003087] text-white transition-colors hover:bg-[#003087]/90'
            icon={<Icons.paypal />}
          >
            Support me on PayPal
          </DonateButton>
          <DonateButton
            href={kofi}
            platform='kofi'
            className='bg-[#FF5E5B] text-white transition-colors hover:bg-[#FF5E5B]/90'
            icon={<Icons.kofi className='fill-white stroke-black stroke-1' />}
          >
            Support me on Ko-fi
          </DonateButton>
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
          className='aspect-[1108/632] w-[69.25rem] bg-gradient-to-r from-[#4cc9f0] to-[#4361ee] opacity-20'
        />
      </div>
    </div>
  );
}
