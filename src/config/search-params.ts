import {
  createLoader,
  createSearchParamsCache,
  createSerializer,
  parseAsArrayOf,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";

import { ITEM_CATEGORIES } from "@/config/constants";

export const searchParams = {
  search: parseAsString.withDefault(""),
  sort: parseAsStringLiteral([
    "popular",
    "new",
    "updated",
    "mostUsed",
  ]).withDefault("popular"),
  items: parseAsArrayOf(parseAsString),
  categories: parseAsArrayOf(parseAsStringLiteral(ITEM_CATEGORIES)),
};

export const urlKeys = {
  search: "q",
  sort: "sort",
  items: "items",
  categories: "categories",
};

export const loadSearchParams = createLoader(searchParams, { urlKeys });
export const searchParamsCache = createSearchParamsCache(searchParams, {
  urlKeys,
});
export const serializeSearchParams = createSerializer(searchParams, {
  urlKeys,
});
