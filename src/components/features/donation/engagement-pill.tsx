"use client";

import Link from "next/link";
import { HeartHandshake } from "lucide-react";

import { useIsAdFree } from "@/hooks/use-is-ad-free";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

interface EngagementPillProps {
  className?: string;
}

export function EngagementPill({ className }: EngagementPillProps) {
  const isAdFree = useIsAdFree();

  if (isAdFree) return null;

  return (
    <Link
      href='/donate'
      className={cn(
        buttonVariants({ variant: "outline", size: "sm" }),
        cn(
          "h-8 gap-1.5 rounded-full border-primary/30 bg-primary/5 px-3 text-xs font-medium text-primary hover:bg-primary/10 hover:text-primary",
          className,
        ),
      )}
    >
      <HeartHandshake className='size-3.5' />
      <span>Go ad-free for $3/mo</span>
    </Link>
  );
}
