import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";
import { EngagementPill } from "@/components/features/donation/engagement-pill";
import { DesktopNav } from "@/components/layout/desktop-nav";
import { HeaderAuth } from "@/components/layout/header-auth";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Icons } from "@/components/shared/icons";
import { ModeToggle } from "@/components/shared/mode-toggle";
import { RepoStarsButton } from "@/components/shared/repo-stars-button";

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
      <div className='mx-auto flex h-16 max-w-(--breakpoint-2xl) items-center px-4 sm:px-6 lg:px-8'>
        <div className='mr-6 shrink-0'>
          <Link href='/' className='flex items-center gap-x-2'>
            <Image
              src='/logo.webp'
              width={40}
              height={40}
              alt='Logo'
              priority
            />
            <span className='hidden font-semibold tracking-tighter min-[414px]:inline-block'>
              {siteConfig.name}
            </span>
          </Link>
        </div>
        <DesktopNav className='hidden lg:ml-6 lg:flex lg:gap-x-8' />
        <div className='flex flex-1 items-center justify-end gap-2'>
          <EngagementPill className='hidden min-[800px]:inline-flex' />
          <div className='flex items-center gap-0.5'>
            <nav className='flex items-center gap-0.5'>
              <RepoStarsButton />
              <Button variant='ghost' size='icon' className='size-9'>
                <a
                  href={siteConfig.links.discord}
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  <Icons.Discord />
                  <span className='sr-only'>Discord</span>
                </a>
              </Button>
            </nav>
            <ModeToggle />
          </div>
          <HeaderAuth />
        </div>
        <MobileNav />
      </div>
    </header>
  );
}
