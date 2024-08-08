import Link from "next/link";
import { HeartIcon } from "lucide-react";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";

import { Icons } from "./ui/icons";

const navigation = [
  { name: "Privacy Policy", href: "/privacy-policy" },
  { name: "Terms of Service", href: "/terms-of-service" },
  { name: "Contact", href: "/contact" },
  { name: "Donate", href: "/donate" },
];

export function Footer() {
  return (
    <footer>
      <div className='mx-auto max-w-screen-2xl overflow-hidden px-6 py-12 md:flex md:items-center md:justify-between md:gap-x-6 lg:px-8'>
        <nav
          aria-label='Footer'
          className='columns-2 sm:flex sm:justify-center sm:space-x-2 md:order-2 lg:space-x-12'
        >
          {navigation.map((item) => (
            <div key={item.name}>
              <Button asChild variant='link'>
                <Link href={item.href}>{item.name}</Link>
              </Button>
            </div>
          ))}
        </nav>
        <div className='mt-4 flex justify-center space-x-6 md:order-3 md:mt-0'>
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
        <div className='mt-8 md:order-1 md:mt-0'>
          <p className='flex items-center justify-center gap-x-1 text-center text-xs leading-5'>
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
    </footer>
  );
}
