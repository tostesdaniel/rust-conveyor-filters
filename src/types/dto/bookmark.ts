import type { PublicFilterListDTO } from "./public-filter";

/**
 * Minimal bookmark data with public filter DTO
 */
export interface BookmarkDTO {
  id: number;
  filterId: number;
  filter: PublicFilterListDTO;
}
