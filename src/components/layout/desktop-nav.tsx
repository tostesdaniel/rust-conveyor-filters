"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SITE_NAV_ITEMS } from "@/components/layout/header";

export function DesktopNav({
  className,
  ...props
}: React.ComponentProps<"nav">) {
  const pathname = usePathname();

  return (
    <nav className={className} {...props}>
      {SITE_NAV_ITEMS.map((item) => (
        <Button
          key={item.href}
          variant='link'
          asChild
          className={cn(
            "rounded-none text-primary/70 hover:no-underline",
            "border-b-2 border-transparent hover:border-primary/80 hover:text-primary/90",
            pathname === item.href && "!border-blue-500 !text-primary",
          )}
        >
          <Link href={item.href}>{item.name}</Link>
        </Button>
      ))}
    </nav>
  );
}
