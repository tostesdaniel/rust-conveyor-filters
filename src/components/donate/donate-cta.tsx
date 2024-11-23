import Link from "next/link";
import { Heart } from "lucide-react";

import { BadgeType } from "@/types/badges";
import { Button } from "@/components/ui/button";
import { UserBadge } from "@/components/ui/user-badge";

export function DonateCTA() {
  return (
    <div className='flex items-center gap-x-2 rounded-lg border bg-card p-4'>
      <div className='flex-1'>
        <h3 className='font-semibold'>Support the Project</h3>
        {/* TODO: Improve badge flow inside the text */}
        <div className='mt-1 inline-flex flex-wrap items-baseline justify-start gap-1 whitespace-pre-wrap text-wrap text-sm text-muted-foreground'>
          <span>Donate to get a special</span>
          <div className='relative top-[2px] inline-flex items-center gap-1'>
            <UserBadge type={BadgeType.DONATOR} />
            <span>badge</span>
          </div>
          <span>and help keep the project running!</span>
        </div>
      </div>
      <Button asChild variant='outline' size='sm'>
        <Link href='/donate'>
          <Heart />
          Donate
        </Link>
      </Button>
    </div>
  );
}
