import { ItemIcon } from "@/components/shared/item-icon";

interface FilterImageProps {
  imagePath: string;
}

export function FilterImage({ imagePath }: FilterImageProps) {
  if (!imagePath) {
    return (
      <div className='flex size-9 shrink-0 items-center justify-center rounded-md border border-dashed border-input' />
    );
  }

  return (
    <ItemIcon
      imagePath={imagePath}
      size='medium'
      alt='Filter cover item image'
      width={36}
      height={36}
      unoptimized
    />
  );
}
