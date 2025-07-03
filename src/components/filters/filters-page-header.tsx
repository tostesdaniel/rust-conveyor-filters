import Image from "next/image";
import {
  ClerkLoaded,
  ClerkLoading,
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/nextjs";
import { Loader2Icon } from "lucide-react";

import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { Typography } from "@/components/ui/typography";
import { DesktopNav } from "@/components/desktop-nav";
import { MobileNav } from "@/components/mobile-nav";
import { ModeToggle } from "@/components/mode-toggle";
import { RepoStarsButton } from "@/components/repo-stars-button";

export function FiltersPageHeader() {
  return (
    <header className='flex h-16 shrink-0 items-center transition-[width,height] ease-linear'>
      <div className='flex flex-1 items-center justify-between'>
        <div className='flex shrink-0 items-center gap-2'>
          <Image
            src='/logo.png'
            alt='Conveyor'
            width={40}
            height={40}
            className='md:hidden'
          />
          <Typography variant='h3' as='h1' className='hidden flex-1 sm:block'>
            Browse Filters
          </Typography>
          <DesktopNav className='hidden xl:ml-6 xl:flex xl:gap-x-8' />
        </div>

        <div className='ml-auto flex items-center lg:ml-6 lg:justify-end'>
          <div className='flex items-center gap-0.5'>
            <RepoStarsButton />
            <Button variant='ghost' size='icon' className='size-9'>
              <a
                href={siteConfig.links.discord}
                target='_blank'
                rel='noopener noreferrer'
              >
                <Icons.discord />
                <span className='sr-only'>Discord</span>
              </a>
            </Button>
            <ModeToggle />
          </div>
          <div className='ml-2 flex h-7 w-auto items-center'>
            <ClerkLoading>
              <Loader2Icon className='h-5 w-5 animate-spin text-muted-foreground' />
            </ClerkLoading>
            <ClerkLoaded>
              <SignedOut>
                <Button
                  variant='default'
                  className='hidden min-[800px]:block'
                  asChild
                >
                  <SignInButton
                    fallbackRedirectUrl='/my-filters'
                    signUpFallbackRedirectUrl='/my-filters'
                  />
                </Button>
              </SignedOut>
              <SignedIn>
                <UserButton />
              </SignedIn>
            </ClerkLoaded>
          </div>
        </div>
        <MobileNav />
      </div>
    </header>
  );
}
