import { clerkClient, type User } from "@clerk/nextjs/server";

import { BadgeType } from "@/types/badges";
import type { ConveyorFilter, ConveyorFilterWithAuthor } from "@/types/filter";

export function clerkUserToAuthorDisplay(user: User): string | null {
  const discordAccount = user.externalAccounts?.find(
    (account: { provider: string }) => account.provider === "oauth_discord",
  );
  if (discordAccount) {
    return discordAccount.username ?? null;
  }
  return user.username ?? null;
}

export function clerkUserToBadges(user: User): BadgeType[] {
  const badges: BadgeType[] = [];
  const verifiedType = user.publicMetadata?.verifiedType as
    | BadgeType
    | undefined;
  if (verifiedType) {
    badges.push(verifiedType);
  }
  const meta = user.publicMetadata as UserPublicMetadata | undefined;
  if (meta?.isSubscriber) {
    badges.push(BadgeType.SUPPORTER);
  } else if (meta?.isDonator || meta?.isLegacyDonator) {
    badges.push(BadgeType.DONATOR);
  }
  return badges;
}

export async function enrichWithAuthor(
  filters: ConveyorFilter[],
): Promise<ConveyorFilterWithAuthor[]> {
  try {
    // Get unique author IDs
    const uniqueAuthorIds = [
      ...new Set(filters.map((filter) => filter.authorId)),
    ];

    // Fetch all users in a single request
    const client = await clerkClient();
    const usersResponse = await client.users.getUserList({
      userId: uniqueAuthorIds,
    });

    const userMap = new Map(
      usersResponse.data.map((user: User) => [user.id, user]),
    );

    return filters.map((filter) => {
      try {
        const user = userMap.get(filter.authorId);
        if (!user) {
          return {
            ...filter,
            author: null,
            badges: [],
            creatorUsername: null,
          };
        }

        return {
          ...filter,
          author: clerkUserToAuthorDisplay(user),
          badges: clerkUserToBadges(user),
          creatorUsername: user.username ?? null,
        };
      } catch (error) {
        return {
          ...filter,
          author: null,
          badges: [],
          creatorUsername: null,
        };
      }
    });
  } catch (error) {
    return filters.map((filter) => ({
      ...filter,
      author: null,
      badges: [],
      creatorUsername: null,
    }));
  }
}
