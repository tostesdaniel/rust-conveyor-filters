import { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import { Button, ButtonProps } from "./button";

interface Props extends ButtonProps {
  icon: LucideIcon;
  iconPosition?: "left" | "right";
}

export function ButtonWithIcon({
  children,
  icon: Icon,
  iconPosition = "left",
  className,
  ...props
}: Props) {
  return (
    <Button
      className={cn(
        "gap-x-2",
        iconPosition === "right" && "flex-row-reverse",
        className,
      )}
      {...props}
    >
      <Icon className='h-4 w-4' />
      {children}
    </Button>
  );
}
