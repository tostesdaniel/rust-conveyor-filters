"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

import { SITE_NAV_ITEMS } from "./header";

export function DesktopNav() {
  const pathname = usePathname();

  return (
    <nav className='mr-4 hidden md:flex md:gap-x-4'>
      {SITE_NAV_ITEMS.map((item, i) => (
        <Link
          key={i}
          href={item.href}
          className={cn(
            "transition-colors hover:text-foreground",
            pathname === item.href ? "text-foreground" : "text-foreground/60",
          )}
        >
          {item.name}
        </Link>
      ))}
    </nav>
  );
}
