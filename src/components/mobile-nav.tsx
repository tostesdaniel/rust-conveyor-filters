"use client";

import { useState } from "react";
import Image from "next/image";
import Link, { LinkProps } from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu } from "lucide-react";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

import { SITE_NAV_ITEMS } from "./header";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant='ghost'
          className='ml-2 w-9 px-0 hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden'
        >
          <Menu className='h-6 w-6' />
          <span className='sr-only'>Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side='right' className='p-6'>
        <MobileLink
          href='/'
          className='flex items-center'
          onOpenChange={setOpen}
        >
          <Image
            src='/logo.png'
            className='mr-2'
            width={40}
            height={40}
            alt='Logo'
            quality={100}
          />
          <span className='font-bold'>{siteConfig.name}</span>
        </MobileLink>
        <div className='mt-6 pl-6'>
          <div className='flex flex-col space-y-2'>
            {SITE_NAV_ITEMS.map((item, i) => (
              <MobileLink
                key={i}
                href={item.href}
                onOpenChange={setOpen}
                className={cn(
                  "transition-colors hover:text-foreground",
                  pathname?.startsWith(item.href)
                    ? "text-foreground"
                    : "text-foreground/60",
                )}
              >
                {item.name}
              </MobileLink>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface MobileLinkProps extends LinkProps {
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

function MobileLink({
  href,
  onOpenChange,
  className,
  children,
  ...props
}: MobileLinkProps) {
  const router = useRouter();

  return (
    <Link
      href={href}
      onClick={() => {
        router.push(href.toString());
        onOpenChange?.(false);
      }}
      className={cn(className)}
      {...props}
    >
      {children}
    </Link>
  );
}
