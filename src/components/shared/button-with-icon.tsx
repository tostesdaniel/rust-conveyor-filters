import { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Props extends React.ComponentProps<typeof Button> {
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
      className={cn(iconPosition === "right" && "flex-row-reverse", className)}
      {...props}
    >
      <Icon />
      {children}
    </Button>
  );
}
