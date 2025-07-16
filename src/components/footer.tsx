import Link from "next/link";
import { HeartIcon } from "lucide-react";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";

import { Icons } from "./shared/icons";

const navigation = [
  { name: "Privacy Policy", href: "/privacy-policy" },
  { name: "Steam Guide", href: "/steam-guide" },
  { name: "Contact", href: "/contact" },
  { name: "Donate", href: "/donate" },
];

export function Footer() {
  return (
    <footer>
      <div className='mx-auto max-w-(--breakpoint-2xl) overflow-hidden px-6 py-12 min-[800px]:flex min-[800px]:items-center min-[800px]:justify-between min-[800px]:gap-x-6 lg:px-8'>
        <nav
          aria-label='Footer'
          className='columns-2 min-[800px]:order-2 sm:flex sm:justify-center sm:space-x-2 lg:space-x-12'
        >
          {navigation.map((item) => (
            <div key={item.name} className='grid-cols-2'>
              {item.href.startsWith("https://") ? (
                <Button asChild variant='link'>
                  <a href={item.href} target='_blank' rel='noopener noreferrer'>
                    {item.name}
                  </a>
                </Button>
              ) : (
                <Button
                  asChild
                  variant='link'
                  className={cn(
                    item.href === "/contact" &&
                      "pointer-events-none opacity-50",
                  )}
                >
                  <Link href={item.href}>{item.name}</Link>
                </Button>
              )}
            </div>
          ))}
        </nav>
        <div className='mt-4 flex justify-center space-x-6 min-[800px]:order-3 min-[800px]:mt-0'>
          <a
            href={siteConfig.links.discord}
            target='_blank'
            rel='noopener noreferrer'
            aria-label={`Discord Community of ${siteConfig.name}`}
          >
            <div
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "w-9 px-0",
                "transition-colors hover:bg-transparent hover:text-foreground/85",
              )}
            >
              <Icons.discord className='h-5 w-5' />
              <span className='sr-only'>Discord Server</span>
            </div>
          </a>
          <a
            href={siteConfig.links.repo}
            target='_blank'
            rel='noopener noreferrer'
            aria-label='GitHub repository of rust-conveyor-filters'
          >
            <div
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "w-9 px-0",
                "transition-colors hover:bg-transparent hover:text-foreground/85",
              )}
            >
              <Icons.gitHub className='h-5 w-5' />
              <span className='sr-only'>GitHub</span>
            </div>
          </a>
        </div>
        <div className='mt-8 flex flex-col items-center min-[800px]:order-1 min-[800px]:mt-0 min-[800px]:items-start'>
          <p className='mt-2 flex items-center justify-center gap-x-1 text-center text-xs leading-5'>
            Made with{" "}
            <HeartIcon
              aria-label='love'
              className='inline h-3 w-3'
              fill='red'
              strokeWidth={0}
            />
            by
            <a
              href={siteConfig.links.gitHub}
              target='_blank'
              rel='noopener noreferrer'
              aria-label='GitHub profile of tostesdaniel'
              className='underline-offset-4 hover:underline'
            >
              <strong>tostesdaniel</strong>
            </a>
          </p>
        </div>
      </div>
      <div className='border-t border-border/40'>
        <p className='mx-auto max-w-(--breakpoint-2xl) px-6 py-4 text-center text-xs leading-5 text-muted-foreground lg:px-8'>
          This app is not affiliated with, endorsed, sponsored, or specifically
          approved by Facepunch Studios. It is an unofficial fan-made tool.
        </p>
      </div>
    </footer>
  );
}
