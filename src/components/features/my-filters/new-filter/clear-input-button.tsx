import { EraserIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ClearInputButtonProps {
  setSearch: React.Dispatch<React.SetStateAction<string>>;
}
export function ClearInputButton({ setSearch }: ClearInputButtonProps) {
  return (
    <Button
      type='button'
      size='icon'
      variant='ghost'
      className='absolute top-1/2 right-3 -translate-y-1/2 opacity-50 hover:bg-transparent hover:opacity-100'
      onClick={() => setSearch("")}
    >
      <EraserIcon className='h-4 w-4' />
      <span className='sr-only'>Clear input</span>
    </Button>
  );
}
