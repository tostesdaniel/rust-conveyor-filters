import Link from "next/link";
import { SignedIn, SignedOut, SignUpButton } from "@clerk/nextjs";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { DonateCTA } from "@/components/donate/donate-cta";

export function HeroContent() {
  return (
    <div className='mx-auto max-w-2xl shrink-0 lg:mx-0 lg:max-w-xl'>
      <div className='mt-8 sm:mt-12 lg:mt-16'>
        <div className='border-border bg-background/80 hover:bg-background mb-8 flex max-w-fit items-center justify-center space-x-2 overflow-hidden rounded-full border px-7 py-2 shadow-md backdrop-blur transition-all'>
          <p className='text-muted-foreground text-sm font-semibold'>
            <span
              role='img'
              aria-label='Party Popper emoji'
              className='select-none'
            >
              🎉
            </span>{" "}
            Now with filter categories!
          </p>
        </div>
        <Typography
          variant='h1'
          className='bg-clip-text font-extrabold [text-wrap:balance] sm:text-5xl'
        >
          Streamline Your{" "}
          <span className='bg-gradient-to-br from-[#4cc9f0] to-[#4361ee] bg-clip-text text-transparent'>
            Rust Base Automation
          </span>{" "}
          with Ease
        </Typography>
        <p className='text-muted-foreground mt-6 text-lg'>
          Tired of spending hours setting up conveyor filters every wipe? Our
          application lets you create, edit, and share custom conveyor setups
          effortlessly. Browse a public directory, save your favorite filters,
          and export configurations directly into Rust for a seamless and
          efficient loot sorting experience. Revolutionize your gameplay and
          reclaim your time!
        </p>
        <div className='mt-10 flex items-center gap-x-6'>
          <SignedIn>
            <Button type='button' asChild>
              <Link href='/my-filters'>Go to My Filters</Link>
            </Button>
          </SignedIn>
          <SignedOut>
            <Button type='button' asChild>
              <SignUpButton
                signInFallbackRedirectUrl='/my-filters'
                fallbackRedirectUrl='/my-filters'
              >
                Get Started Now
              </SignUpButton>
            </Button>
          </SignedOut>
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
