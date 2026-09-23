export enum BadgeType {
  CONTENT_CREATOR = "content_creator",
  DONATOR = "donator",
  OFFICIAL = "official",
  CONTRIBUTOR = "contributor",
  SUPPORTER = "supporter",
  SERVER_BOOSTER = "server_booster",
}

export interface UserBadge {
  verifiedType?: BadgeType.OFFICIAL | BadgeType.CONTENT_CREATOR;
  isDonator?: boolean;
  isSubscriber?: boolean;
  isServerBooster?: boolean;
}
