import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  numeric,
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
    categoryId: integer("category_id").references(() => userCategories.id, {
      onDelete: "set null",
    }),
    subCategoryId: integer("sub_category_id").references(
      () => subCategories.id,
      { onDelete: "set null" },
    ),
    order: integer("order").default(0),
    viewCount: integer("view_count").default(0),
    exportCount: integer("export_count").default(0),
    popularityScore: integer("popularity_score").default(0),
    createdAt: timestamp("created_at")
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at")
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    uniqueIndex: uniqueIndex("filters_id_idx").on(t.id),
    popularityIdx: index("filters_popularity_idx").on(
      t.popularityScore.desc(),
      t.id.asc(),
    ),
    createdAtIdx: index("filters_created_at_idx").on(
      t.createdAt.desc(),
      t.id.asc(),
    ),
    updatedAtIdx: index("filters_updated_at_idx").on(
      t.updatedAt.desc(),
      t.id.asc(),
    ),
    exportCountIdx: index("filters_export_count_idx").on(
      t.exportCount.desc(),
      t.id.asc(),
    ),
  }),
);

export type Filter = typeof filters.$inferSelect;
export type NewFilter = typeof filters.$inferInsert;

export const filtersRelations = relations(filters, ({ many, one }) => ({
  filterItems: many(filterItems),
  userCategory: one(userCategories, {
    fields: [filters.categoryId],
    references: [userCategories.id],
  }),
  subCategory: one(subCategories, {
    fields: [filters.subCategoryId],
    references: [subCategories.id],
  }),
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

export const filterEventEnum = pgEnum("filter_event_enum", ["view", "export"]);

export const filterEvents = pgTable("filter_events", {
  id: serial("id").primaryKey(),
  filterId: integer("filter_id")
    .notNull()
    .references(() => filters.id, {
      onDelete: "cascade",
    }),
  eventType: filterEventEnum("event_type").notNull(),
  userId: varchar("user_id", { length: 255 }),
  ip: varchar("ip", { length: 255 }),
  timestamp: timestamp("created_at")
    .notNull()
    .default(sql`now()`),
});

export type FilterEvent = typeof filterEvents.$inferSelect;
export type NewFilterEvent = typeof filterEvents.$inferInsert;

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

export const bookmarks = pgTable("bookmarks", {
  id: serial("id").primaryKey(),
  authorId: varchar("author_id", { length: 255 }).notNull(),
  filterId: integer("filter_id")
    .notNull()
    .references(() => filters.id, { onDelete: "cascade" }),
});

export const bookmarkRelations = relations(bookmarks, ({ one }) => ({
  filter: one(filters, {
    fields: [bookmarks.filterId],
    references: [filters.id],
  }),
}));

export const userCategories = pgTable("user_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  userId: varchar("user_id", { length: 255 }).notNull(),
});

export const subCategories = pgTable("user_sub_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  parentId: integer("parent_id")
    .notNull()
    .references(() => userCategories.id, { onDelete: "cascade" }),
});

export type UserCategory = typeof userCategories.$inferSelect;
export type NewUserCategory = typeof userCategories.$inferInsert;
export type SubCategory = typeof subCategories.$inferSelect;
export type NewSubCategory = typeof subCategories.$inferInsert;

export const userCategoriesRelations = relations(
  userCategories,
  ({ many }) => ({
    filters: many(filters),
    subCategories: many(subCategories),
  }),
);

export const subCategoriesRelations = relations(
  subCategories,
  ({ one, many }) => ({
    parent: one(userCategories, {
      fields: [subCategories.parentId],
      references: [userCategories.id],
    }),
    filters: many(filters),
  }),
);

export const donationPlatformEnum = pgEnum("donation_platform_enum", [
  "kofi",
  "buyMeACoffee",
]);

export const donationTypeEnum = pgEnum("donation_type_enum", [
  "Donation",
  "Subscription",
]);

export const donations = pgTable(
  "donations",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id", { length: 255 }),
    email: varchar("email", { length: 255 }),
    platform: donationPlatformEnum("platform").notNull(),
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull(),
    type: donationTypeEnum("type").notNull(),
    transactionId: varchar("transaction_id", { length: 255 })
      .unique()
      .notNull(),
    createdAt: timestamp("timestamp").defaultNow().notNull(),
  },
  (t) => [
    index("donations_user_idx").on(t.userId),
    index("donations_email_idx").on(t.email),
  ],
);

export type Donation = typeof donations.$inferSelect;
export type NewDonation = typeof donations.$inferInsert;
