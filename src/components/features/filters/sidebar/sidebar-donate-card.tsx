"use client";

import Link from "next/link";
import { HeartHandshake } from "lucide-react";

import { useIsAdFree } from "@/hooks/use-is-ad-free";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarDonateCardProps {
  className?: string;
}

export function SidebarDonateCard({ className }: SidebarDonateCardProps) {
  const isAdFree = useIsAdFree();
  if (isAdFree) return null;

  return (
    <div
      className={cn(
        "rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm",
        className,
      )}
    >
      <div className='flex items-center gap-2 font-semibold text-foreground'>
        <HeartHandshake className='size-4 text-primary' />
        <span>Go ad-free</span>
      </div>
      <p className='mt-1 text-xs leading-snug text-muted-foreground'>
        $3/mo removes ads and helps keep the site running.
      </p>
      <Button
        asChild
        size='sm'
        className='mt-2 h-8 w-full gap-1.5 text-xs font-medium'
      >
        <Link href='/donate'>Subscribe</Link>
      </Button>
    </div>
  );
}
