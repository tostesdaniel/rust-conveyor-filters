"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Copy, Eye, EyeOff, Loader } from "lucide-react";
import { toast } from "sonner";

import { revokeShareToken } from "@/actions/shareTokens";
import { useServerActionMutation } from "@/hooks/server-action-hooks";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { useGetShareToken } from "@/hooks/use-get-share-token";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

export function ShareTokenDisplay() {
  const queryClient = useQueryClient();
  const [isVisible, setIsVisible] = useState(false);
  const [_, copy] = useCopyToClipboard();
  const { data: shareToken, isLoading } = useGetShareToken();
  const { mutate: revokeTokenMutation, isPending } = useServerActionMutation(
    revokeShareToken,
    {
      onSuccess: () => {
        toast.success("New token generated");
        queryClient.invalidateQueries({
          queryKey: ["share-token"],
        });
        setIsVisible(true);
      },
      onError: () => {
        toast.error("Failed to generate new token");
      },
    },
  );

  const handleCopy = (text: string) => () => {
    copy(text)
      .then(async () => {
        toast.success("Copied to clipboard", {
          description: "Share this token with trusted people only",
        });
      })
      .catch((error) => {
        toast.error(`Failed to copy: ${error.message}`);
      });
  };

  if (isLoading || !shareToken) {
    return (
      <div className='flex w-full max-w-sm flex-col'>
        <div className='flex justify-between gap-x-2'>
          <Skeleton className='h-10 flex-1' />
          <Skeleton className='h-10 w-10' />
        </div>
        <div className='mt-1 flex items-center gap-x-1'>
          <Skeleton className='h-4 w-36' />
          <Skeleton className='h-4 w-16' />
        </div>
      </div>
    );
  }

  return (
    <div className='flex w-full max-w-sm flex-col'>
      <Label htmlFor='share-token' className='sr-only'>
        Your share token
      </Label>
      <div className='relative flex justify-between gap-x-2'>
        <Input
          id='share-token'
          type='text'
          placeholder={isVisible ? shareToken.token : "*********************"}
          value=''
          readOnly
          aria-describedby='share-token-description'
          className={cn(
            "placeholder:text-foreground placeholder:opacity-100",
            "transition-[padding-left,opacity] duration-300 ease-in-out",
            isPending && "pl-8 opacity-50",
            "bg-muted pr-10",
            !isVisible && "-pt-0.5 pb-0.5 font-bold tracking-wide",
          )}
        />

        <Button
          type='button'
          variant='secondary'
          onClick={() => setIsVisible(!isVisible)}
          className='absolute top-1 right-[52px] size-8 bg-muted hover:bg-background/50'
          aria-label={isVisible ? "Hide token" : "Show token"}
        >
          {isVisible ? <EyeOff /> : <Eye />}
        </Button>

        {isPending && (
          <Loader className='absolute top-3 left-3 size-4 animate-spin' />
        )}
        <div className='w-10'>
          <Button
            onClick={handleCopy(shareToken.token)}
            size='icon'
            disabled={isPending}
            className='transition-opacity duration-200 ease-in-out'
          >
            <Copy />
            <span className='sr-only'>Copy token</span>
          </Button>
        </div>
      </div>
      <p
        id='share-token-description'
        className='self-start text-sm text-muted-foreground'
      >
        Token compromised?
        <Button
          type='button'
          variant='link'
          className='text-xs'
          disabled={isPending}
          onClick={() => revokeTokenMutation(undefined)}
        >
          Regenerate
        </Button>
      </p>
    </div>
  );
}
