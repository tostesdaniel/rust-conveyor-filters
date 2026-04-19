"use client";

import Link from "next/link";
import { HeartHandshake } from "lucide-react";

import { useIsAdFree } from "@/hooks/use-is-ad-free";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EngagementPillProps {
  className?: string;
}

export function EngagementPill({ className }: EngagementPillProps) {
  const isAdFree = useIsAdFree();

  if (isAdFree) return null;

  return (
    <Button
      asChild
      variant='outline'
      size='sm'
      className={cn(
        "h-8 gap-1.5 rounded-full border-primary/30 bg-primary/5 px-3 text-xs font-medium text-primary hover:bg-primary/10 hover:text-primary",
        className,
      )}
    >
      <Link href='/donate'>
        <HeartHandshake className='size-3.5' />
        <span>Go ad-free — $3/mo</span>
      </Link>
    </Button>
  );
}
