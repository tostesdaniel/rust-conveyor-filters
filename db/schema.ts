import { relations } from "drizzle-orm";
import {
  integer,
  pgTable,
  primaryKey,
  serial,
  varchar,
} from "drizzle-orm/pg-core";

export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  itemId: integer("itemid").notNull(),
  shortname: varchar("shortname", { length: 256 }).notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  category: varchar("category", { length: 256 }).notNull(),
  imagePath: varchar("image_path", { length: 256 }).notNull(),
});

export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;

export const itemsRelations = relations(items, ({ many }) => ({
  itemsToFilters: many(itemsToFilters),
}));

export const filters = pgTable("filters", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  authorId: varchar("author_id", { length: 256 }).notNull(),
  imagePath: varchar("image_path", { length: 256 }).notNull(),
});

export const filtersRelations = relations(filters, ({ many }) => ({
  itemsToFilters: many(itemsToFilters),
}));

export type Filter = typeof filters.$inferSelect;
export type NewFilter = typeof filters.$inferInsert;

export const itemsToFilters = pgTable(
  "items_to_filters",
  {
    itemId: integer("item_id")
      .notNull()
      .references(() => items.id),
    filterId: integer("filter_id")
      .notNull()
      .references(() => filters.id),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.itemId, t.filterId] }),
  }),
);

export const itemsToFiltersRelations = relations(itemsToFilters, ({ one }) => ({
  filters: one(filters, {
    fields: [itemsToFilters.filterId],
    references: [filters.id],
  }),
  items: one(items, {
    fields: [itemsToFilters.itemId],
    references: [items.id],
  }),
}));

export type ItemToFilter = typeof itemsToFilters.$inferSelect;
export type NewItemToFilter = typeof itemsToFilters.$inferInsert;

export const categories = pgTable("categories", {
  id: integer("id").primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
});

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
