import type { CreatorPublicHierarchy } from "@/data/creator-public";

export type CreatorCategoryBucket = {
  id: number;
  name: string;
  count: number;
};

export type CreatorLibrarySummary = {
  uncategorizedCount: number;
  categoryBuckets: CreatorCategoryBucket[];
  categoryCountWithFilters: number;
};

export function summarizeCreatorLibrary(
  hierarchy: CreatorPublicHierarchy,
): CreatorLibrarySummary {
  const uncategorizedCount = hierarchy.uncategorized.length;
  const categoryBuckets = hierarchy.categories
    .map((cat) => {
      const inSubCategories = cat.subCategories.reduce(
        (n, sub) => n + sub.filters.length,
        0,
      );

      const count = cat.filters.length + inSubCategories;

      return { id: cat.id, name: cat.name, count };
    })
    .filter((b) => b.count > 0)
    .slice()
    .sort((a, b) => b.count - a.count);

  return {
    uncategorizedCount,
    categoryBuckets,
    categoryCountWithFilters: categoryBuckets.length,
  };
}

const nf = new Intl.NumberFormat("en-US");

export function librarySynopsisLine(
  publicFilterCount: number,
  summary: CreatorLibrarySummary,
): string | null {
  if (publicFilterCount === 0) {
    return null;
  }

  const { uncategorizedCount, categoryCountWithFilters } = summary;

  const allUncategorized =
    categoryCountWithFilters === 0 && uncategorizedCount > 0;

  const allCategorized =
    uncategorizedCount === 0 && categoryCountWithFilters > 0;

  if (allUncategorized) {
    return "Everything lives in the uncategorized lane for now.";
  }

  if (allCategorized) {
    const n = categoryCountWithFilters;
    return n === 1
      ? "Organized under a single public category."
      : `Spans ${nf.format(n)} public categories.`;
  }

  return `${nf.format(categoryCountWithFilters)} categories and ${nf.format(uncategorizedCount)} uncategorized.`;
}
