"use client";

import { useUser } from "@clerk/nextjs";

export function useIsDonator(): boolean {
  const { user } = useUser();
  return !!(user?.publicMetadata as UserPublicMetadata | undefined)?.isDonator;
}
