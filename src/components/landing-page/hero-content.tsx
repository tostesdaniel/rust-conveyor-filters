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
        <Typography variant='h1' className='font-extrabold sm:text-5xl'>
          Streamline Your Rust Base Automation with Ease
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
          <SignedIn>
            <Button type='button' asChild>
              <Link href='/my-filters'>Go to My Filters</Link>
            </Button>
          </SignedIn>
          <SignedOut>
            <Button type='button' asChild>
              <SignUpButton>Get Started Now</SignUpButton>
            </Button>
          </SignedOut>
          <Button type='button' variant='link'>
            <Link href='/filters'>Browse Filters</Link>
            <ArrowRight />
          </Button>
        </div>
        <div className='mt-8'>
          <DonateCTA />
        </div>
      </div>
    </div>
  );
}
