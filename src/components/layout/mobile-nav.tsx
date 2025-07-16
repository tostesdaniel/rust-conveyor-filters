"use client";

import { useState } from "react";
import Image from "next/image";
import Link, { LinkProps } from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BoxIcon,
  Filter,
  HeartIcon,
  InfoIcon,
  Menu,
  MessageSquareIcon,
  type LucideIcon,
} from "lucide-react";
import { VisuallyHidden } from "radix-ui";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { MobileFiltersSidebar } from "@/components/features/filters/sidebar/mobile-filters-sidebar";
import { SITE_NAV_ITEMS, type Navigation } from "@/components/layout/header";

type MobileNavigation = Navigation & {
  readonly icon: LucideIcon;
};

const NAV_ICON_MAP = {
  "/filters": BoxIcon,
  "/my-filters": HeartIcon,
  "/feedback": MessageSquareIcon,
  "/about": InfoIcon,
} as const satisfies Record<string, LucideIcon>;

const createMobileNavItems = (): readonly MobileNavigation[] =>
  SITE_NAV_ITEMS.map(
    (item): MobileNavigation => ({
      ...item,
      icon: NAV_ICON_MAP[item.href as keyof typeof NAV_ICON_MAP] ?? Filter,
    }),
  );

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const mobileNavItems = createMobileNavItems();

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
      <SheetContent
        side='right'
        className='grow gap-y-5 overflow-y-auto px-6 pb-4'
      >
        <VisuallyHidden.Root>
          <SheetTitle>Navigation Menu</SheetTitle>
          <SheetDescription>
            Navigate through the app sections and access filtering tools for
            your search.
          </SheetDescription>
        </VisuallyHidden.Root>
        <div className='flex h-16 shrink-0 items-center'>
          <Image
            src='/logo.png'
            width={40}
            height={40}
            alt='Logo'
            quality={100}
            priority
          />
        </div>
        <nav className='flex flex-1 flex-col'>
          <ul className='flex flex-1 flex-col'>
            <li>
              <ul className='-mx-2 space-y-1'>
                {mobileNavItems.map((item, i) => {
                  const IconComponent = item.icon;
                  return (
                    <li key={i}>
                      <MobileLink
                        key={i}
                        href={item.href}
                        onOpenChange={setOpen}
                        className={cn(
                          "w-full",
                          pathname?.startsWith(item.href)
                            ? "text-foreground"
                            : "text-foreground/60",
                        )}
                      >
                        <IconComponent className='h-4 w-4' />
                        {item.name}
                      </MobileLink>
                    </li>
                  );
                })}
              </ul>
            </li>
            {pathname === "/filters" && (
              <>
                <Separator className='my-4 w-full' />
                <li>
                  <MobileFiltersSidebar />
                </li>
              </>
            )}
          </ul>
        </nav>
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

  const handleClick = () => {
    router.push(href.toString());
    onOpenChange?.(false);
  };

  return (
    <Button asChild variant='ghost' className={cn("justify-start", className)}>
      <Link href={href} onClick={handleClick} {...props}>
        {children}
      </Link>
    </Button>
  );
}
