import type { BadgeType } from "@/types/badges";

/**
 * Minimal item data for carousel/list display and export
 */
export interface PublicFilterItemDTO {
  item: { name: string; imagePath: string; shortname: string } | null;
  category: { name: string; id: number } | null;
  max: number;
  buffer: number;
  min: number;
}

/**
 * Minimal filter for list view
 */
export interface PublicFilterListDTO {
  id: number;
  name: string;
  description: string | null;
  imagePath: string;
  createdAt: Date;
  updatedAt: Date;
  filterItems: PublicFilterItemDTO[];
  author: string | null;
  badges: BadgeType[];
}
