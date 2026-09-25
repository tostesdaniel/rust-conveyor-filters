import type { JSX } from "react";
import {
  Clapperboard,
  CodeXmlIcon,
  Crown,
  HeartHandshake,
  Verified,
} from "lucide-react";

import { BadgeType } from "@/types/badges";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { GemIcon } from "@/components/shared/gem-icon";

const badgeConfig: Record<
  BadgeType,
  {
    icon: JSX.Element;
    className: string;
    label: string;
    labelClassName?: string;
  }
> = {
  [BadgeType.DONATOR]: {
    icon: <Crown className='size-3' />,
    className: "bg-violet-500/10 text-violet-500 hover:bg-violet-500/20",
    label: "Donator",
  },
  [BadgeType.SUPPORTER]: {
    icon: <HeartHandshake className='size-3' />,
    className: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
    label: "Supporter",
  },
  [BadgeType.SERVER_BOOSTER]: {
    icon: <GemIcon className='size-3' />,
    className: "bg-fuchsia-500/10 hover:bg-fuchsia-500/20",
    label: "Server Booster",
    labelClassName:
      "bg-linear-to-r from-[#f55cc4] to-[#6a72ea] bg-clip-text text-transparent",
  },
  [BadgeType.CONTRIBUTOR]: {
    icon: <CodeXmlIcon className='size-3' />,
    className: "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20",
    label: "Contributor",
  },
  [BadgeType.CONTENT_CREATOR]: {
    icon: <Clapperboard className='size-3' />,
    className: "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20",
    label: "Content Creator",
  },
  [BadgeType.OFFICIAL]: {
    icon: <Verified className='size-3' />,
    className:
      "border-transparent bg-foreground text-background hover:bg-foreground/90",
    label: "Official",
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
      <span className={config.labelClassName}>{config.label}</span>
    </Badge>
  );
}
