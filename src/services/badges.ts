import { clerkClient } from "@clerk/nextjs/server";

import { BadgeType } from "@/types/badges";

export async function setDonatorStatus(userId: string, isDonator: boolean) {
  await (
    await clerkClient()
  ).users.updateUserMetadata(userId, {
    publicMetadata: {
      isDonator,
    },
  });
}

export async function setSubscriberStatus(
  userId: string,
  isSubscriber: boolean,
) {
  await (
    await clerkClient()
  ).users.updateUserMetadata(userId, {
    publicMetadata: {
      isSubscriber,
    },
  });
}

export async function setNitroBoosterStatus(
  userId: string,
  isNitroBooster: boolean,
) {
  await (
    await clerkClient()
  ).users.updateUserMetadata(userId, {
    publicMetadata: {
      isNitroBooster,
    },
  });
}

export async function setContentCreatorStatus(userId: string) {
  await (
    await clerkClient()
  ).users.updateUserMetadata(userId, {
    publicMetadata: {
      verifiedType: BadgeType.CONTENT_CREATOR,
    },
  });
}
