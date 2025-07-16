/* eslint-disable jsx-a11y/alt-text */
import type { ImageProps } from "next/image";
import Image from "next/image";

import { cn } from "@/lib/utils";

type ThemeImageProps = Omit<ImageProps, "src" | "priority" | "loading"> & {
  srcLight: string;
  srcDark: string;
};

export function ThemeImage({
  srcLight,
  srcDark,
  className,
  ...props
}: ThemeImageProps) {
  return (
    <>
      <Image
        {...props}
        src={srcLight}
        className={cn("dark:hidden", className)}
      />
      <Image
        {...props}
        src={srcDark}
        className={cn("hidden dark:inline", className)}
      />
    </>
  );
}
