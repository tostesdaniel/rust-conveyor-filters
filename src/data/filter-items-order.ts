import type { AnyColumn } from "drizzle-orm";

/**
 * Canonical ordering for a filter's items.
 *
 * Every relational query that loads `filterItems` for display or export MUST
 * use this so an exported filter comes out in the exact same item order no
 * matter where it was copied from (overview, edit page, public detail, remix
 * source, shared-with-me, bookmarks, creator profiles).
 */
export const filterItemsOrderBy = (fields: {
  id: AnyColumn;
  createdAt: AnyColumn;
}) => [fields.id, fields.createdAt];
