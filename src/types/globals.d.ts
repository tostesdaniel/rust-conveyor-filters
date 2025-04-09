export {};

declare global {
  interface UserPublicMetadata {
    verifiedType?: "official" | "content_creator" | "contributor";
    isDonator?: boolean;
  }
}
