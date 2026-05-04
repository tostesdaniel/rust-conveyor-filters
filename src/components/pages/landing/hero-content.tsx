import { useId } from "react";
import Link from "next/link";
import { Show, SignUpButton } from "@clerk/nextjs";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DonateCTA } from "@/components/features/donation/donate-cta";
import { Typography } from "@/components/shared/typography";

export function HeroContent() {
  const pillArrowGradientId = useId();

  return (
    <div className='mx-auto max-w-2xl shrink-0 lg:mx-0 lg:max-w-xl'>
      <div className='mt-8 sm:mt-12 lg:mt-16'>
        <Link
          href='/users/rustconveyorfilters'
          className='group mb-8 flex max-w-fit items-center justify-center overflow-hidden rounded-full border border-border bg-background/80 px-7 py-2 shadow-md backdrop-blur transition-colors hover:bg-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none'
        >
          <p className='text-sm font-semibold text-muted-foreground'>
            <span
              role='img'
              aria-label='Party Popper emoji'
              className='select-none'
            >
              🎉
            </span>{" "}
            User Profiles are here!
            <span className='ml-1 inline-flex items-center gap-1'>
              <span className='bg-linear-to-br from-[#4cc9f0] to-[#4361ee] bg-clip-text text-transparent'>
                Try it
              </span>
              <svg
                className='size-3.5 shrink-0 transition-transform group-hover:translate-x-px'
                width='24'
                height='24'
                viewBox='0 0 24 24'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
                aria-hidden='true'
              >
                <defs>
                  <linearGradient
                    id={pillArrowGradientId}
                    x1='0'
                    y1='0'
                    x2='24'
                    y2='24'
                    gradientUnits='userSpaceOnUse'
                  >
                    <stop stopColor='#4cc9f0' />
                    <stop offset='1' stopColor='#4361ee' />
                  </linearGradient>
                </defs>
                <path
                  d='M5 12h14'
                  stroke={`url(#${pillArrowGradientId})`}
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
                <path
                  d='m12 5 7 7-7 7'
                  stroke={`url(#${pillArrowGradientId})`}
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
              </svg>
            </span>
          </p>
        </Link>
        <Typography
          variant='h1'
          className='bg-clip-text font-extrabold text-balance sm:text-5xl'
        >
          Streamline Your{" "}
          <span className='bg-linear-to-br from-[#4cc9f0] to-[#4361ee] bg-clip-text text-transparent'>
            Rust Base Automation
          </span>{" "}
          with Ease
        </Typography>
        <p className='mt-6 text-lg text-muted-foreground'>
          Tired of spending hours setting up conveyor filters every wipe? Our
          application lets you create, edit, and share custom conveyor setups
          effortlessly. Browse a public directory, save your favorite filters,
          and export configurations directly into Rust for a seamless and
          efficient loot sorting experience. Revolutionize your gameplay and
          reclaim your time!
        </p>
        <div className='mt-10 flex items-center gap-x-6'>
          <Show when='signed-in'>
            <Button type='button' asChild>
              <Link href='/my-filters'>Go to My Filters</Link>
            </Button>
          </Show>
          <Show when='signed-out'>
            <Button type='button' asChild>
              <SignUpButton>Get Started Now</SignUpButton>
            </Button>
          </Show>
          <Button type='button' variant='link' className='group' asChild>
            <Link href='/filters'>
              Browse Filters
              <ArrowRight className='transition-transform group-hover:translate-x-0.5' />
            </Link>
          </Button>
        </div>
        <div className='mt-8'>
          <DonateCTA />
        </div>
      </div>
    </div>
  );
}
