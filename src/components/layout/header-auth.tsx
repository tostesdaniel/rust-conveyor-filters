"use client";

import { ClerkLoaded, ClerkLoading, Show, SignInButton } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/layout/user-menu";

export function HeaderAuth() {
  return (
    <div className='ml-2 flex h-7 w-auto items-center'>
      <ClerkLoading>
        <Loader2 className='size-5 animate-spin text-muted-foreground' />
      </ClerkLoading>
      <ClerkLoaded>
        <Show when='signed-out'>
          <Button
            variant='default'
            className='hidden min-[800px]:block'
            render={
              <SignInButton
                fallbackRedirectUrl='/my-filters'
                signUpFallbackRedirectUrl='/my-filters'
              />
            }
          />
        </Show>
        <Show when='signed-in'>
          <UserMenu />
        </Show>
      </ClerkLoaded>
    </div>
  );
}
