"use client";

import * as React from "react";
import { CircleAlertIcon, CircleHelpIcon, type LucideIcon } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface RowMessage {
  tone: "warning" | "note";
  text: string;
}

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

const TONE_CLASS = {
  warning: "text-yellow-600 dark:text-yellow-400",
  note: "text-muted-foreground",
} as const;

const TONE_ICON = {
  warning: CircleAlertIcon,
  note: CircleHelpIcon,
} as const;

function useIconMotion() {
  const reduce = useReducedMotion();
  const hidden = {
    opacity: 0,
    transform: reduce ? "scale(1)" : "scale(0.7)",
    filter: reduce ? "blur(0px)" : "blur(2px)",
  };
  return {
    initial: hidden,
    animate: { opacity: 1, transform: "scale(1)", filter: "blur(0px)" },
    exit: { ...hidden, transition: { duration: 0.12, ease: EASE_OUT } },
    transition: { duration: 0.2, ease: EASE_OUT },
  };
}

function MessageList({ messages }: { messages: readonly RowMessage[] }) {
  return (
    <ul className='flex flex-col gap-2'>
      {messages.map((message) => {
        const Icon = TONE_ICON[message.tone];
        return (
          <li key={message.text} className='flex gap-2'>
            <Icon
              className={cn(
                "mt-px size-3.5 shrink-0",
                TONE_CLASS[message.tone],
              )}
            />
            <span>{message.text}</span>
          </li>
        );
      })}
    </ul>
  );
}

function HoverPopover({
  label,
  messages,
  className,
  children,
}: {
  label: string;
  messages: readonly RowMessage[];
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Popover>
      <PopoverTrigger
        openOnHover
        delay={80}
        closeDelay={120}
        aria-label={label}
        className={cn(
          "grid place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className,
        )}
      >
        {children}
      </PopoverTrigger>
      <PopoverContent
        side='top'
        className='w-64 gap-2 p-3 text-xs leading-snug'
      >
        <MessageList messages={messages} />
      </PopoverContent>
    </Popover>
  );
}

export function RowStatusIcon({
  label,
  messages,
}: {
  label: string;
  messages: readonly RowMessage[];
}) {
  const iconMotion = useIconMotion();
  const tone = messages.some((message) => message.tone === "warning")
    ? "warning"
    : messages.length
      ? "note"
      : null;

  return (
    <AnimatePresence initial={false}>
      {tone && (
        <motion.span
          key='status'
          {...iconMotion}
          className='absolute inset-y-0 left-1.5 flex items-center'
        >
          <HoverPopover
            label={`${label}: ${tone === "warning" ? "warning" : "note"}`}
            messages={messages}
            className={cn("relative size-5", TONE_CLASS[tone])}
          >
            <AnimatePresence initial={false}>
              <motion.span
                key={tone}
                {...iconMotion}
                className='absolute inset-0 grid place-items-center'
              >
                {React.createElement(TONE_ICON[tone], { className: "size-4" })}
              </motion.span>
            </AnimatePresence>
          </HoverPopover>
        </motion.span>
      )}
    </AnimatePresence>
  );
}

export interface ImageBadge {
  key: string;
  Icon: LucideIcon;
  tone: RowMessage["tone"];
  text: string;
}

export function ImageBadges({ badges }: { badges: readonly ImageBadge[] }) {
  const iconMotion = useIconMotion();
  return (
    <div className='absolute bottom-1 left-1 flex gap-1'>
      <AnimatePresence initial={false}>
        {badges.map((badge) => (
          <motion.span key={badge.key} {...iconMotion}>
            <HoverPopover
              label={badge.text}
              messages={[{ tone: badge.tone, text: badge.text }]}
              className={cn(
                "size-6 bg-background/90 shadow-xs ring-1 ring-foreground/10 backdrop-blur-sm",
                TONE_CLASS[badge.tone],
              )}
            >
              <badge.Icon className='size-3.5' />
            </HoverPopover>
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}
