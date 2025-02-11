import { BoxesIcon, BoxIcon, Users2Icon } from "lucide-react";
import * as motion from "motion/react-client";

import { cn } from "@/lib/utils";

import { StatValueClient } from "./stat-value-client";

const iconMap = {
  users: Users2Icon,
  box: BoxIcon,
  boxes: BoxesIcon,
} as const;

interface Stat {
  name: string;
  value: number;
  icon: keyof typeof iconMap;
}

interface StatsGridProps {
  stats: Stat[];
  className?: string;
}

export function StatsGrid({ className, stats, ...props }: StatsGridProps) {
  return (
    <motion.dl
      aria-label='Key statistics'
      className={cn(
        "mt-16 grid grid-cols-1 gap-x-8 gap-y-16 text-center lg:grid-cols-3",
        className,
      )}
      viewport={{ once: true }}
      initial='hidden'
      whileInView='visible'
      variants={{
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.25,
            delayChildren: 0.25,
          },
        },
      }}
      {...props}
    >
      {stats.map(({ name, value, icon }) => {
        const Icon = iconMap[icon];

        return (
          <motion.div
            key={name}
            className='mx-auto flex max-w-xs flex-col gap-y-4'
            variants={{
              hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
              visible: {
                opacity: 1,
                y: 0,
                filter: "blur(0px)",
                transition: { duration: 0.5, ease: "easeOut" },
              },
            }}
          >
            <dt className='text-base/7 text-muted-foreground'>{name}</dt>
            <dd className='order-first text-3xl font-semibold tracking-tight sm:text-5xl'>
              <span className='flex items-center justify-center gap-x-4'>
                <Icon
                  className='size-7 text-muted-foreground sm:size-10'
                  aria-hidden='true'
                  role='presentation'
                />
                <StatValueClient statValue={value} />
              </span>
            </dd>
          </motion.div>
        );
      })}
    </motion.dl>
  );
}
