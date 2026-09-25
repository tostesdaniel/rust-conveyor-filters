export {};

declare global {
  interface UserPublicMetadata {
    verifiedType?: "official" | "content_creator" | "contributor";
    /** New 3rd-party donators (BMC/Ko-fi/Patreon) - badge only */
    isDonator?: boolean;
    /** Grandfathers donators from BMC/Ko-fi - badge + ad-free */
    isLegacyDonator?: boolean;
    /** Active subscribers - set via billing webhook */
    isSubscriber?: boolean;
    /** Server boosters - badge + ad-free while the boost lasts */
    isServerBooster?: boolean;
    /** PayNow customer id linked to this Clerk user */
    paynowCustomerId?: string;
  }
}
