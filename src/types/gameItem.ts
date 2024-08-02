export type GameItem = {
  itemid: number;
  shortname: string;
  Name: string;
  Description: string;
  Category: string;
  maxDraggable: number;
  ItemType: string;
  AmountType: string;
  stackable: number;
  quickDespawn: boolean;
  rarity: string;
  condition: Condition;
  Parent: number;
  isWearable: boolean;
  isHoldable: boolean;
  isUsable: boolean;
  HasSkins: boolean;
};

type Condition = {
  enabled: boolean;
  max: number;
  repairable: boolean;
};

export type GameConveyorFilterItem = {
  TargetCategory: number | null;
  MaxAmountInOutput: number;
  BufferAmount: number;
  MinAmountInInput: number;
  IsBlueprint: boolean;
  BufferTransferRemaining: number;
  TargetItemName: string;
};
