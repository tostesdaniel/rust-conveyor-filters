import { relations, sql } from "drizzle-orm";
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  serial,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  itemId: integer("itemid").notNull(),
  shortname: varchar("shortname", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 255 }).notNull(),
  imagePath: varchar("image_path", { length: 255 }).notNull(),
});

export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;

export const itemsRelations = relations(items, ({ many }) => ({
  filterItems: many(filterItems),
}));

export const filters = pgTable(
  "filters",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: varchar("description", { length: 255 }),
    authorId: varchar("author_id", { length: 255 }).notNull(),
    imagePath: varchar("image_path", { length: 255 }).notNull(),
    isPublic: boolean("is_public").notNull().default(false),
    createdAt: timestamp("created_at")
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at")
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    uniqueIndex: uniqueIndex("filters_id_idx").on(t.id),
  }),
);

export type Filter = typeof filters.$inferSelect;
export type NewFilter = typeof filters.$inferInsert;

export const filtersRelations = relations(filters, ({ many }) => ({
  filterItems: many(filterItems),
}));

export const filterItems = pgTable(
  "filter_items",
  {
    id: serial("id").primaryKey(),
    filterId: integer("filter_id")
      .notNull()
      .references(() => filters.id, { onDelete: "cascade" }),
    itemId: integer("item_id").references(() => items.id, {
      onDelete: "cascade",
    }),
    categoryId: integer("category_id").references(() => categories.id, {
      onDelete: "no action",
    }),
    max: integer("max").notNull().default(0),
    buffer: integer("buffer").notNull().default(0),
    min: integer("min").notNull().default(0),
    createdAt: timestamp("created_at")
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at")
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    uniqueIndex: uniqueIndex("unique_idx").on(t.itemId, t.filterId),
  }),
);

export type FilterItem = typeof filterItems.$inferSelect;
export type NewFilterItem = typeof filterItems.$inferInsert;

export const filterItemRelations = relations(filterItems, ({ one }) => ({
  filter: one(filters, {
    fields: [filterItems.filterId],
    references: [filters.id],
  }),
  item: one(items, {
    fields: [filterItems.itemId],
    references: [items.id],
  }),
  category: one(categories, {
    fields: [filterItems.categoryId],
    references: [categories.id],
  }),
}));

export const categories = pgTable("categories", {
  id: integer("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
});

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

export const feedbackTypeEnum = pgEnum("feedback_type_enum", [
  "bug",
  "feature",
  "general",
]);
export const ratingEnum = pgEnum("rating_enum", ["1", "2", "3", "4", "5"]);

export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  authorId: varchar("author_id", { length: 255 }).notNull(),
  feedbackType: feedbackTypeEnum("feedback_type").notNull(),
  feedback: varchar("feedback", { length: 255 }).notNull(),
  rating: ratingEnum("rating").notNull(),
  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`now()`),
});

export type Feedback = typeof feedback.$inferSelect;
export type NewFeedback = typeof feedback.$inferInsert;
