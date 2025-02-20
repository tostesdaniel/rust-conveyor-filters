import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export function LoadingButton({
  children,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button disabled {...props}>
      <Loader2 className='animate-spin' />
      {children}
    </Button>
  );
}
