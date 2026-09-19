"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";
import { getR2ImageUrl, type ImageSize } from "@/utils/r2-images";

export const PLACEHOLDER_ICON = "_placeholder";

interface ItemIconProps extends Omit<ImageProps, "src" | "onError"> {
  imagePath: string;
  /** The item's `iconVersion`. */
  version?: string | null;
  size: ImageSize;
}

export function ItemIcon({
  imagePath,
  version,
  size,
  alt,
  ...props
}: ItemIconProps) {
  const [failedPath, setFailedPath] = useState<string | null>(null);
  const failed = failedPath === imagePath;

  return (
    <Image
      {...props}
      alt={alt}
      src={
        failed
          ? getR2ImageUrl(`${PLACEHOLDER_ICON}.webp`, size)
          : getR2ImageUrl(`${imagePath}.webp`, size, version)
      }
      onError={() => setFailedPath(imagePath)}
    />
  );
}
