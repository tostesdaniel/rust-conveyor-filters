import { clerkClient } from "@clerk/nextjs/server";

import { BadgeType } from "@/types/badges";

export async function setDonatorStatus(userId: string, isDonator: boolean) {
  (await clerkClient()).users.updateUserMetadata(userId, {
    publicMetadata: {
      isDonator,
    },
  });
}

export async function setContentCreatorStatus(userId: string) {
  (await clerkClient()).users.updateUserMetadata(userId, {
    publicMetadata: {
      verifiedType: BadgeType.CONTENT_CREATOR,
    },
  });
}
