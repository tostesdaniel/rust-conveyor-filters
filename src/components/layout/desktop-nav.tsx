"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { SITE_NAV_ITEMS } from "@/components/layout/header";

export function DesktopNav({
  className,
  ...props
}: React.ComponentProps<"nav">) {
  const pathname = usePathname();

  return (
    <nav className={className} {...props}>
      {SITE_NAV_ITEMS.map((item) => (
        <Link
          href={item.href}
          key={item.href}
          className={cn(
            buttonVariants({ variant: "link" }),
            "rounded-none text-primary/70 hover:no-underline",
            "border-x-0 border-t-0 border-b-2 border-b-transparent",
            "hover:border-b-primary/80 hover:text-primary/90",
            pathname === item.href && "border-b-blue-500! text-primary!",
          )}
        >
          {item.name}
        </Link>
      ))}
    </nav>
  );
}
