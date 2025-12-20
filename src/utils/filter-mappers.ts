import type { enrichWithAuthor } from "@/utils/enrich-filter";

import type {
  ConveyorFilter,
  OwnerFilterDTO,
  PublicFilterListDTO,
  SharedFilterDTO,
} from "@/types/filter";

/**
 * Convert ConveyorFilter to OwnerFilterDTO
 * Includes owner-specific fields
 */
export function toOwnerFilterDTO(filter: ConveyorFilter): OwnerFilterDTO {
  return {
    id: filter.id,
    name: filter.name,
    description: filter.description,
    imagePath: filter.imagePath,
    isPublic: filter.isPublic,
    categoryId: filter.categoryId,
    subCategoryId: filter.subCategoryId,
    order: filter.order,
    createdAt: filter.createdAt,
    updatedAt: filter.updatedAt,
    filterItems: filter.filterItems.map((item) => ({
      item: item.item
        ? {
            name: item.item.name,
            imagePath: item.item.imagePath,
            shortname: item.item.shortname,
          }
        : null,
      category: item.category
        ? {
            name: item.category.name,
            id: item.category.id,
          }
        : null,
      max: item.max,
      buffer: item.buffer,
      min: item.min,
      // Include IDs and createdAt for editing
      itemId: item.itemId,
      categoryId: item.categoryId,
      createdAt: item.createdAt,
    })),
  };
}

/**
 * Convert ConveyorFilter to SharedFilterDTO
 */
export function toSharedFilterDTO(filter: ConveyorFilter): SharedFilterDTO {
  return {
    id: filter.id,
    name: filter.name,
    description: filter.description,
    imagePath: filter.imagePath,
    categoryId: filter.categoryId,
    subCategoryId: filter.subCategoryId,
    createdAt: filter.createdAt,
    updatedAt: filter.updatedAt,
    filterItems: filter.filterItems.map((item) => ({
      item: item.item
        ? {
            name: item.item.name,
            imagePath: item.item.imagePath,
            shortname: item.item.shortname,
          }
        : null,
      category: item.category
        ? {
            name: item.category.name,
            id: item.category.id,
          }
        : null,
      max: item.max,
      buffer: item.buffer,
      min: item.min,
      // Include IDs and createdAt for editing
      itemId: item.itemId,
      categoryId: item.categoryId,
      createdAt: item.createdAt,
    })),
  };
}

/**
 * Convert enriched filter to public DTO, stripping internal fields
 * Excludes owner-specific fields and adds author information
 */
export function toPublicFilterDTO(
  filter: Awaited<ReturnType<typeof enrichWithAuthor>>[0],
): PublicFilterListDTO {
  return {
    id: filter.id,
    name: filter.name,
    description: filter.description,
    imagePath: filter.imagePath,
    categoryId: filter.categoryId,
    createdAt: filter.createdAt,
    updatedAt: filter.updatedAt,
    filterItems: filter.filterItems.map((item) => ({
      item: item.item
        ? {
            name: item.item.name,
            imagePath: item.item.imagePath,
            shortname: item.item.shortname,
          }
        : null,
      category: item.category
        ? {
            name: item.category.name,
            id: item.category.id,
          }
        : null,
      max: item.max,
      buffer: item.buffer,
      min: item.min,
      // Include IDs and createdAt for editing
      itemId: item.itemId,
      categoryId: item.categoryId,
      createdAt: item.createdAt,
    })),
    author: filter.author,
    badges: filter.badges,
  };
}
