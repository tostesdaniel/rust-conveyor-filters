export enum FilterSettingsFieldDescription {
  MAX = "Stop transferring once we have this many of this item in the target container. Set to 0 to transfer as many as possible.",
  BUFFER = "Start transferring when this amount is in the container and transfer that amount exactly.",
  MIN = "Only transfer if there is this amount in the input container.",
}
