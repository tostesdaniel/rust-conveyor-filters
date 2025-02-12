import { BoxesIcon, BoxIcon, Users2Icon } from "lucide-react";

export const iconMap = {
  users: Users2Icon,
  box: BoxIcon,
  boxes: BoxesIcon,
} as const;

export interface Stat {
  name: string;
  value: number;
  icon: keyof typeof iconMap;
}
