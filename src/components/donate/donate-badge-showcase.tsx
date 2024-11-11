import { BadgeType } from "@/types/badges";
import { Typography } from "@/components/ui/typography";
import { UserBadge } from "@/components/ui/user-badge";

export function DonateBadgeShowcase() {
  return (
    <div className='mt-10 flex flex-col items-center space-y-4 rounded-lg border bg-foreground/5 p-6 text-center shadow-[0_0_50px_-12px] shadow-[#4cc9f0]/30 ring-1 ring-foreground/10'>
      <Typography variant='h3' className='text-xl font-semibold'>
        Get Your Special Badge
      </Typography>
      <div className='flex flex-col items-center space-y-2'>
        <UserBadge type={BadgeType.DONATOR} className='scale-110' />
        <Typography variant='mutedText' className='max-w-md text-sm'>
          After your donation, you&apos;ll receive this exclusive badge that
          will be displayed next to your name across the site
        </Typography>
      </div>
    </div>
  );
}
