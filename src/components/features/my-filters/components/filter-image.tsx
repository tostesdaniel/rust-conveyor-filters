import { ItemIcon } from "@/components/shared/item-icon";

interface FilterImageProps {
  imagePath: string;
  version?: string | null;
}

export function FilterImage({ imagePath, version }: FilterImageProps) {
  if (!imagePath) {
    return (
      <div className='flex size-9 shrink-0 items-center justify-center rounded-md border border-dashed border-input' />
    );
  }

  return (
    <ItemIcon
      imagePath={imagePath}
      version={version}
      size='medium'
      alt='Filter cover item image'
      width={36}
      height={36}
      unoptimized
    />
  );
}
