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
    /** Discord Nitro Boosters - ad-free as community thank-you */
    isNitroBooster?: boolean;
    /** PayNow customer id linked to this Clerk user */
    paynowCustomerId?: string;
  }
}
