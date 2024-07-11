import { type Item } from "@/db/schema";

export interface ItemWithFields extends Omit<Item, "id"> {
  id: string;
  max: number;
  buffer: number;
  min: number;
}

export type NewConveyorItem = {
  itemId: number;
  name: string;
  imagePath: string;
  max: number;
  buffer: number;
  min: number;
};
