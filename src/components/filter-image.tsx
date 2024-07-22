import Image from "next/image";

interface FilterImageProps {
  imagePath: string;
}

export function FilterImage({ imagePath }: FilterImageProps) {
  const itemImage = `/items/${imagePath}.png`;

  if (!imagePath) {
    return (
      <div className='flex h-10 w-10 items-center justify-center rounded-md border border-dashed border-input' />
    );
  }

  return (
    <Image
      src={itemImage}
      alt='Filter cover item image'
      width={40}
      height={40}
    />
  );
}
