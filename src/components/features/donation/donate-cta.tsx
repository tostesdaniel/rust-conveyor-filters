"use client";

import Link from "next/link";
import { Heart } from "lucide-react";

import { useIsAdFree } from "@/hooks/use-is-ad-free";
import { Button } from "@/components/ui/button";

export function DonateCTA() {
  const isAdFree = useIsAdFree();
  if (isAdFree) return null;

  return (
    <div className='flex items-center gap-x-2 rounded-lg border bg-card p-4'>
      <div className='flex-1'>
        <h3 className='font-semibold'>Support the Project</h3>
        <p className='mt-1 text-sm text-muted-foreground'>
          Go ad-free for $3/mo and help keep the site running. No features
          locked - just a cleaner experience.
        </p>
      </div>
      <Button asChild variant='outline'>
        <Link href='/donate'>
          <Heart />
          Subscribe
        </Link>
      </Button>
    </div>
  );
}
