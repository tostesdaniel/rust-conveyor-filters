import { siteConfig } from "@/app/config/site";
import { cn } from "@/lib/utils";
import {
  ClerkLoaded,
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { DesktopNav } from "./desktop-nav";
import { MobileNav } from "./mobile-nav";
import { ModeToggle } from "./mode-toggle";
import { Button, buttonVariants } from "./ui/button";
import { Icons } from "./ui/icons";

export type Navigation = {
  name: string;
  href: string;
};

export const SITE_NAV_ITEMS: Navigation[] = [
  { name: "Home", href: "/" },
  { name: "Filters", href: "/filters" },
  { name: "My Filters", href: "/my-filters" },
  { name: "Feedback", href: "/feedback" },
  { name: "About", href: "/about" },
];

export function Header() {
  return (
    <header className='sticky top-0 border-b border-border/40 bg-background'>
      <div className='mx-auto flex h-14 max-w-screen-2xl items-center px-4 sm:px-6 lg:px-8'>
        <div className='mr-6'>
          <Link href='/' className='flex items-center space-x-2'>
            <Image src='/logo.png' width={40} height={40} alt='Logo' />
            <span className='hidden font-semibold tracking-tighter min-[414px]:inline-block'>
              {siteConfig.name}
            </span>
          </Link>
        </div>
        <DesktopNav />
        <div className='flex flex-1 items-center justify-end'>
          <nav className='flex items-center'>
            <Link
              href={siteConfig.links.gitHub}
              target='_blank'
              rel='noreferrer'
            >
              <div
                className={cn(buttonVariants({ variant: "ghost" }), "w-9 px-0")}
              >
                <Icons.gitHub className='h-4 w-4' />
                <span className='sr-only'>GitHub</span>
              </div>
            </Link>
          </nav>
          <ModeToggle />
          <div className='ml-2 flex items-center'>
            <ClerkLoaded>
              <SignedOut>
                <Button
                  variant='default'
                  size='sm'
                  className='hidden min-[800px]:block'
                  asChild
                >
                  <SignInButton />
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
