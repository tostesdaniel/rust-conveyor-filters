/** Matching for the item pickers, which filter the whole catalogue client side. */
import { matchSorterWithRankInfo, rankings } from "match-sorter";

export interface SearchableItem {
  name: string;
  shortname: string;
  description: string;
}

export interface ItemSearchResult<T> {
  item: T;
  /** Only the description matched, so the name alone won't explain the row. */
  viaDescription: boolean;
}

const DESCRIPTION_KEY = 2;

/**
 * match-sorter's default floor only asks that the query's letters turn up in
 * order, which a 400-character description nearly always satisfies: "ak"
 * pulled 166 of 1006 items. CONTAINS cuts that to 62 and I couldn't find a
 * query it made worse. Ties go to the earlier key, so name beats description.
 */
const OPTIONS = {
  threshold: rankings.CONTAINS,
  keys: ["name", "shortname", "description"],
} as const;

/** No terms means "match everything". */
export function tokenizeQuery(query: string): string[] {
  return query.trim().split(/\s+/).filter(Boolean);
}

/**
 * Every term has to land somewhere, so "explosive ammo" finds Explosive 5.56
 * Rifle Ammo even though no single field holds that phrase. Only the last
 * pass ranks, so terms run backwards and the first word, the one the player
 * leant on, sets the order.
 */
export function searchItems<T extends SearchableItem>(
  items: T[],
  query: string,
): ItemSearchResult<T>[] {
  const terms = tokenizeQuery(query);
  if (terms.length === 0) {
    return items.map((item) => ({ item, viaDescription: false }));
  }

  const viaDescription = new Set<T>();
  let pool: readonly T[] = items;

  for (let i = terms.length - 1; i >= 0; i--) {
    const ranked = matchSorterWithRankInfo(pool, terms[i], OPTIONS);
    for (const { item, keyIndex } of ranked) {
      if (keyIndex === DESCRIPTION_KEY) viaDescription.add(item);
    }
    pool = ranked.map((r) => r.item);
  }

  return pool.map((item) => ({
    item,
    viaDescription: viaDescription.has(item),
  }));
}
