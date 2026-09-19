"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";
import { getR2ImageUrl, type ImageSize } from "@/utils/r2-images";

export const PLACEHOLDER_ICON = "_placeholder";

interface ItemIconProps extends Omit<ImageProps, "src" | "onError"> {
  imagePath: string;
  size: ImageSize;
}

export function ItemIcon({ imagePath, size, alt, ...props }: ItemIconProps) {
  const [failedPath, setFailedPath] = useState<string | null>(null);
  const path = failedPath === imagePath ? PLACEHOLDER_ICON : imagePath;

  return (
    <Image
      {...props}
      alt={alt}
      src={getR2ImageUrl(`${path}.webp`, size)}
      onError={() => setFailedPath(imagePath)}
    />
  );
}
