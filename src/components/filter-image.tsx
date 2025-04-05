import Image from "next/image";

import { getR2ImageUrl } from "@/lib/utils/r2-images";

interface FilterImageProps {
  imagePath: string;
}

export function FilterImage({ imagePath }: FilterImageProps) {
  if (!imagePath) {
    return (
      <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-dashed border-input' />
    );
  }

  return (
    <Image
      src={getR2ImageUrl(imagePath + ".webp", "medium")}
      alt='Filter cover item image'
      width={36}
      height={36}
    />
  );
}
