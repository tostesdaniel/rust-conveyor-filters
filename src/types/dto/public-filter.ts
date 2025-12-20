import type { BadgeType } from "@/types/badges";

/**
 * Minimal item data for carousel/list display and export
 */
export interface FilterItemDTO {
  item: { name: string; imagePath: string; shortname: string } | null;
  category: { name: string; id: number } | null;
  max: number;
  buffer: number;
  min: number;
  // Optional fields for editing (only present in OwnerFilterDTO)
  itemId?: number | null;
  categoryId?: number | null;
  createdAt?: Date;
}

/**
 * Filter DTO for authenticated user's own filters
 * Includes owner-specific fields like isPublic, subCategoryId, and order
 */
export interface OwnerFilterDTO {
  id: number;
  name: string;
  description: string | null;
  imagePath: string;
  isPublic: boolean;
  categoryId: number | null;
  subCategoryId: number | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  filterItems: FilterItemDTO[];
}

/**
 * Filter DTO for filters received from others via sharing
 * Excludes order field (not relevant for received filters)
 */
export interface SharedFilterDTO {
  id: number;
  name: string;
  description: string | null;
  imagePath: string;
  categoryId: number | null;
  subCategoryId: number | null;
  createdAt: Date;
  updatedAt: Date;
  filterItems: FilterItemDTO[];
}

/**
 * Minimal filter for public list view
 * Extends base filter with author information
 */
export interface PublicFilterListDTO {
  id: number;
  name: string;
  description: string | null;
  imagePath: string;
  categoryId: number | null;
  createdAt: Date;
  updatedAt: Date;
  filterItems: FilterItemDTO[];
  author: string | null;
  badges: BadgeType[];
}
