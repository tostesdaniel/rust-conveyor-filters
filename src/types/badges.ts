export enum BadgeType {
  CONTENT_CREATOR = "content_creator",
  DONATOR = "donator",
  OFFICIAL = "official",
  CONTRIBUTOR = "contributor",
}

export interface UserBadge {
  verifiedType?: BadgeType.OFFICIAL | BadgeType.CONTENT_CREATOR;
  isDonator?: boolean;
}
