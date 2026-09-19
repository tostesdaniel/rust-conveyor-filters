import { getTableName, sql, type AnyColumn } from "drizzle-orm";

import { items } from "@/db/schema";

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

const checked = sql.identifier("insertable_check");

/**
 * Drops rows whose item is no longer insertable, so they aren't shown,
 * exported or counted against MAX_FILTER_ITEMS. Written as NOT EXISTS because
 * category rows have a null item_id, and NOT IN would drop those too.
 *
 * The relational query builder re-aliases every column object in a nested
 * `where` to the filterItems alias, so the subquery names its columns by hand.
 */
export const filterItemsWhere = (fields: { itemId: AnyColumn }) =>
  sql`not exists (select 1 from ${sql.identifier(getTableName(items))} ${checked} where ${checked}.${sql.identifier(items.id.name)} = ${fields.itemId} and ${checked}.${sql.identifier(items.insertable.name)} = false)`;
