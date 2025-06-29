import Image from "next/image";
import Link from "next/link";
import {
  ClerkLoaded,
  ClerkLoading,
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

import { siteConfig } from "@/config/site";
import { RepoStarsButton } from "@/components/repo-stars-button";

import { DesktopNav } from "./desktop-nav";
import { MobileNav } from "./mobile-nav";
import { ModeToggle } from "./mode-toggle";
import { Button } from "./ui/button";
import { Icons } from "./ui/icons";

export type Navigation = {
  name: string;
  href: string;
};

export const SITE_NAV_ITEMS: Navigation[] = [
  { name: "Filters", href: "/filters" },
  { name: "My Filters", href: "/my-filters" },
  { name: "Feedback", href: "/feedback" },
  { name: "About", href: "/about" },
];

export function Header() {
  return (
    <header className='sticky top-0 z-50 border-b border-border/40 bg-background'>
      <div className='mx-auto flex h-14 max-w-(--breakpoint-2xl) items-center px-4 sm:px-6 lg:px-8'>
        <div className='mr-6 shrink-0'>
          <Link href='/' className='flex items-center space-x-2'>
            <Image src='/logo.png' width={40} height={40} alt='Logo' />
            <span className='hidden font-semibold tracking-tighter min-[414px]:inline-block'>
              {siteConfig.name}
            </span>
          </Link>
        </div>
        <DesktopNav />
        <div className='flex flex-1 items-center justify-end gap-2'>
          <div className='flex items-center gap-0.5'>
            <nav className='flex items-center gap-0.5'>
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
            </nav>
            <ModeToggle />
          </div>
          <div className='ml-2 flex items-center'>
            <ClerkLoading>
              <Loader2 className='h-5 w-5 animate-spin text-muted-foreground' />
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
