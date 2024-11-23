import { Loader2 } from "lucide-react";

import { Button, type ButtonProps } from "@/components/ui/button";

export function LoadingButton({ children, ...props }: ButtonProps) {
  return (
    <Button disabled {...props}>
      <Loader2 className='animate-spin' />
      {children}
    </Button>
  );
}
