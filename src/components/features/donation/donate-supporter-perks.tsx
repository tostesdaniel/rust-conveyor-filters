import { EyeOffIcon, RocketIcon, SparklesIcon } from "lucide-react";

import { BadgeType } from "@/types/badges";
import { UserBadge } from "@/components/shared/user-badge";

const perks = [
  {
    icon: EyeOffIcon,
    title: "Ad-free browsing",
    description: "Browse and search filters across the entire site without ads",
  },
  {
    icon: SparklesIcon,
    title: "Supporter badge",
    description: "Exclusive badge displayed next to your name sitewide",
    badge: true,
  },
  {
    icon: RocketIcon,
    title: "Early access",
    description: "Try new features before they're available to everyone",
  },
];

export function DonateSupporterPerks() {
  return (
    <div className='mt-10 w-full max-w-2xl rounded-lg border bg-card p-6 shadow-[0_0_50px_-12px_rgba(76,201,240,0.3)] ring-1 ring-foreground/10'>
      <h3 className='text-center text-xl font-semibold'>
        What you get as a Supporter
      </h3>
      <ul className='mt-6 space-y-4'>
        {perks.map((perk) => (
          <li key={perk.title} className='flex items-start gap-3'>
            <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-foreground/10'>
              <perk.icon className='h-4 w-4' />
            </div>
            <div>
              <div className='flex items-center gap-2 font-medium'>
                {perk.title}
                {perk.badge && <UserBadge type={BadgeType.SUPPORTER} />}
              </div>
              <p className='text-sm text-muted-foreground'>
                {perk.description}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
