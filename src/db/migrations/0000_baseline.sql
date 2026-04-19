CREATE TYPE "public"."donation_platform_enum" AS ENUM('kofi', 'buyMeACoffee');--> statement-breakpoint
CREATE TYPE "public"."donation_type_enum" AS ENUM('Donation', 'Subscription');--> statement-breakpoint
CREATE TYPE "public"."feedback_type_enum" AS ENUM('bug', 'feature', 'general');--> statement-breakpoint
CREATE TYPE "public"."filter_event_enum" AS ENUM('view', 'export');--> statement-breakpoint
CREATE TYPE "public"."rating_enum" AS ENUM('1', '2', '3', '4', '5');--> statement-breakpoint
CREATE TABLE "bookmarks" (
	"id" serial PRIMARY KEY NOT NULL,
	"author_id" varchar(255) NOT NULL,
	"filter_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "donations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255),
	"email" varchar(255),
	"platform" "donation_platform_enum" NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar(3) NOT NULL,
	"type" "donation_type_enum" NOT NULL,
	"transaction_id" varchar(255) NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "donations_transaction_id_unique" UNIQUE("transaction_id")
);
--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"author_id" varchar(255) NOT NULL,
	"feedback_type" "feedback_type_enum" NOT NULL,
	"feedback" varchar(255) NOT NULL,
	"rating" "rating_enum" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "filter_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"filter_id" integer NOT NULL,
	"event_type" "filter_event_enum" NOT NULL,
	"user_id" varchar(255),
	"ip" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "filter_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"filter_id" integer NOT NULL,
	"item_id" integer,
	"category_id" integer,
	"max" integer DEFAULT 0 NOT NULL,
	"buffer" integer DEFAULT 0 NOT NULL,
	"min" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "filters" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" varchar(255),
	"author_id" varchar(255) NOT NULL,
	"image_path" varchar(255) NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"category_id" integer,
	"sub_category_id" integer,
	"order" integer DEFAULT 0 NOT NULL,
	"view_count" integer DEFAULT 0,
	"export_count" integer DEFAULT 0,
	"popularity_score" integer DEFAULT 0,
	"search_vector" "tsvector",
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" serial PRIMARY KEY NOT NULL,
	"itemid" integer NOT NULL,
	"shortname" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"category" varchar(255) NOT NULL,
	"image_path" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "share_token" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"token" char(21) NOT NULL,
	"revoked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shared_filters" (
	"id" serial PRIMARY KEY NOT NULL,
	"filter_id" integer,
	"share_token_id" integer,
	"sender_id" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_sub_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"parent_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"user_id" varchar(255) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_filter_id_filters_id_fk" FOREIGN KEY ("filter_id") REFERENCES "public"."filters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "filter_events" ADD CONSTRAINT "filter_events_filter_id_filters_id_fk" FOREIGN KEY ("filter_id") REFERENCES "public"."filters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "filter_items" ADD CONSTRAINT "filter_items_filter_id_filters_id_fk" FOREIGN KEY ("filter_id") REFERENCES "public"."filters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "filter_items" ADD CONSTRAINT "filter_items_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "filter_items" ADD CONSTRAINT "filter_items_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "filters" ADD CONSTRAINT "filters_category_id_user_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."user_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "filters" ADD CONSTRAINT "filters_sub_category_id_user_sub_categories_id_fk" FOREIGN KEY ("sub_category_id") REFERENCES "public"."user_sub_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shared_filters" ADD CONSTRAINT "shared_filters_filter_id_filters_id_fk" FOREIGN KEY ("filter_id") REFERENCES "public"."filters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shared_filters" ADD CONSTRAINT "shared_filters_share_token_id_share_token_id_fk" FOREIGN KEY ("share_token_id") REFERENCES "public"."share_token"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sub_categories" ADD CONSTRAINT "user_sub_categories_parent_id_user_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."user_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "donations_user_idx" ON "donations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "donations_email_idx" ON "donations" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_idx" ON "filter_items" USING btree ("item_id","filter_id");--> statement-breakpoint
CREATE UNIQUE INDEX "filters_id_idx" ON "filters" USING btree ("id");--> statement-breakpoint
CREATE INDEX "filters_popularity_idx" ON "filters" USING btree ("popularity_score" DESC NULLS LAST,"id");--> statement-breakpoint
CREATE INDEX "filters_created_at_idx" ON "filters" USING btree ("created_at" DESC NULLS LAST,"id");--> statement-breakpoint
CREATE INDEX "filters_updated_at_idx" ON "filters" USING btree ("updated_at" DESC NULLS LAST,"id");--> statement-breakpoint
CREATE INDEX "filters_export_count_idx" ON "filters" USING btree ("export_count" DESC NULLS LAST,"id");--> statement-breakpoint
CREATE INDEX "filters_search_idx" ON "filters" USING gin ("search_vector");