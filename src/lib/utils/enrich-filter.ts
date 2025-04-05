import { clerkClient, type User } from "@clerk/nextjs/server";

import { BadgeType } from "@/types/badges";
import type { ConveyorFilter, ConveyorFilterWithAuthor } from "@/types/filter";

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
          };
        }

        const discordAccount = user.externalAccounts?.find(
          (account: { provider: string }) =>
            account.provider === "oauth_discord",
        );

        const badges: BadgeType[] = [];
        const verifiedType = user.publicMetadata?.verifiedType as BadgeType;
        if (verifiedType) {
          badges.push(verifiedType);
        }
        if (user.publicMetadata?.isDonator) {
          badges.push(BadgeType.DONATOR);
        }

        return {
          ...filter,
          author: discordAccount ? discordAccount.username : user.username,
          badges,
        };
      } catch (error) {
        return {
          ...filter,
          author: null,
          badges: [],
        };
      }
    });
  } catch (error) {
    return filters.map((filter) => ({
      ...filter,
      author: null,
      badges: [],
    }));
  }
}
