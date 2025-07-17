import type { JSX } from "react";
import {
  Clapperboard,
  CodeXmlIcon,
  HeartHandshake,
  Verified,
} from "lucide-react";

import { BadgeType } from "@/types/badges";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const badgeConfig: Record<
  BadgeType,
  {
    icon: JSX.Element;
    className: string;
    label: string;
  }
> = {
  [BadgeType.DONATOR]: {
    icon: <HeartHandshake className='h-3 w-3' />,
    className: "bg-pink-500/10 text-pink-500 hover:bg-pink-500/20",
    label: "Donator",
  },
  [BadgeType.OFFICIAL]: {
    icon: <Verified className='h-3 w-3' />,
    className: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
    label: "Official",
  },
  [BadgeType.CONTENT_CREATOR]: {
    icon: <Clapperboard className='h-3 w-3' />,
    className: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
    label: "Content Creator",
  },
  [BadgeType.CONTRIBUTOR]: {
    icon: <CodeXmlIcon className='h-3 w-3' />,
    className: "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20",
    label: "Contributor",
  },
};

interface UserBadgeProps {
  type: BadgeType;
  className?: string;
}

export function UserBadge({ type, className }: UserBadgeProps) {
  const config = badgeConfig[type];

  return (
    <Badge
      variant='outline'
      className={cn("gap-x-1 font-normal", config.className, className)}
    >
      {config.icon}
      {config.label}
    </Badge>
  );
}
