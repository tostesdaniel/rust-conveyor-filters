CREATE TYPE "public"."ai_categorization_status_enum" AS ENUM('idle', 'pending', 'processing', 'ok', 'failed');--> statement-breakpoint
CREATE TYPE "public"."donation_platform_enum" AS ENUM('kofi', 'buyMeACoffee');--> statement-breakpoint
CREATE TYPE "public"."donation_type_enum" AS ENUM('Donation', 'Subscription');--> statement-breakpoint
CREATE TYPE "public"."feedback_type_enum" AS ENUM('bug', 'feature', 'general');--> statement-breakpoint
CREATE TYPE "public"."filter_event_enum" AS ENUM('view', 'export');--> statement-breakpoint
CREATE TYPE "public"."item_type_enum" AS ENUM('Generic', 'Liquid');--> statement-breakpoint
CREATE TYPE "public"."rating_enum" AS ENUM('1', '2', '3', '4', '5');--> statement-breakpoint
CREATE TYPE "public"."subscription_interval_enum" AS ENUM('monthly', 'yearly');--> statement-breakpoint
CREATE TYPE "public"."subscription_status_enum" AS ENUM('active', 'canceled', 'refunded', 'chargeback');--> statement-breakpoint
CREATE TYPE "public"."tag_proposal_status_enum" AS ENUM('pending', 'approved', 'rejected', 'merged');--> statement-breakpoint
CREATE TYPE "public"."tag_status_enum" AS ENUM('active', 'archived');--> statement-breakpoint
CREATE TYPE "public"."uncategorized_position_enum" AS ENUM('top', 'bottom');--> statement-breakpoint
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
CREATE TABLE "filter_tag_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"filter_id" integer NOT NULL,
	"tag_id" integer NOT NULL,
	"rank" integer NOT NULL,
	"confidence" numeric(3, 2),
	"model_version" varchar(64) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "filter_tag_proposals" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(64) NOT NULL,
	"label" varchar(64) NOT NULL,
	"rationale" varchar(500),
	"example_filter_id" integer,
	"occurrence_count" integer DEFAULT 1 NOT NULL,
	"status" "tag_proposal_status_enum" DEFAULT 'pending' NOT NULL,
	"merged_into_tag_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "filter_tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(64) NOT NULL,
	"label" varchar(64) NOT NULL,
	"description" varchar(255),
	"status" "tag_status_enum" DEFAULT 'active' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "filter_tags_slug_unique" UNIQUE("slug")
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
	"forked_from_id" integer,
	"forked_from_author_id" varchar(255),
	"output_container_id" integer,
	"view_count" integer DEFAULT 0,
	"export_count" integer DEFAULT 0,
	"popularity_score" integer DEFAULT 0,
	"search_vector" "tsvector",
	"ai_categorization_status" "ai_categorization_status_enum" DEFAULT 'idle' NOT NULL,
	"ai_categorization_content_hash" varchar(64),
	"ai_categorized_at" timestamp,
	"ai_categorization_attempts" integer DEFAULT 0 NOT NULL,
	"ai_categorization_error" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "item_announcements" (
	"manifest_id" varchar(32) PRIMARY KEY NOT NULL,
	"changes" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"posted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" serial PRIMARY KEY NOT NULL,
	"itemid" integer NOT NULL,
	"shortname" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"category" varchar(255) NOT NULL,
	"stack_size" integer DEFAULT 1 NOT NULL,
	"item_type" "item_type_enum" DEFAULT 'Generic' NOT NULL,
	"image_path" varchar(255) NOT NULL,
	"insertable" boolean DEFAULT true NOT NULL,
	"icon_version" varchar(16),
	CONSTRAINT "items_itemid_unique" UNIQUE("itemid")
);
--> statement-breakpoint
CREATE TABLE "paynow_customers" (
	"clerk_user_id" varchar(255) PRIMARY KEY NOT NULL,
	"paynow_customer_id" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "paynow_customers_paynow_customer_id_unique" UNIQUE("paynow_customer_id")
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
	"parent_id" integer NOT NULL,
	"order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"paynow_subscription_id" varchar(255) NOT NULL,
	"clerk_user_id" varchar(255) NOT NULL,
	"paynow_customer_id" varchar(255) NOT NULL,
	"product_id" varchar(255) NOT NULL,
	"interval" "subscription_interval_enum" NOT NULL,
	"status" "subscription_status_enum" NOT NULL,
	"current_period_start" timestamp,
	"current_period_end" timestamp,
	"canceled_at" timestamp,
	"benefits_revoked" boolean DEFAULT false NOT NULL,
	"pending_switch" "subscription_interval_enum",
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_paynow_subscription_id_unique" UNIQUE("paynow_subscription_id")
);
--> statement-breakpoint
CREATE TABLE "user_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"user_id" varchar(255) PRIMARY KEY NOT NULL,
	"uncategorized_position" "uncategorized_position_enum" DEFAULT 'top' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_filter_id_filters_id_fk" FOREIGN KEY ("filter_id") REFERENCES "public"."filters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "filter_events" ADD CONSTRAINT "filter_events_filter_id_filters_id_fk" FOREIGN KEY ("filter_id") REFERENCES "public"."filters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "filter_items" ADD CONSTRAINT "filter_items_filter_id_filters_id_fk" FOREIGN KEY ("filter_id") REFERENCES "public"."filters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "filter_items" ADD CONSTRAINT "filter_items_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "filter_items" ADD CONSTRAINT "filter_items_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "filter_tag_assignments" ADD CONSTRAINT "filter_tag_assignments_filter_id_filters_id_fk" FOREIGN KEY ("filter_id") REFERENCES "public"."filters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "filter_tag_assignments" ADD CONSTRAINT "filter_tag_assignments_tag_id_filter_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."filter_tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "filter_tag_proposals" ADD CONSTRAINT "filter_tag_proposals_example_filter_id_filters_id_fk" FOREIGN KEY ("example_filter_id") REFERENCES "public"."filters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "filter_tag_proposals" ADD CONSTRAINT "filter_tag_proposals_merged_into_tag_id_filter_tags_id_fk" FOREIGN KEY ("merged_into_tag_id") REFERENCES "public"."filter_tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "filters" ADD CONSTRAINT "filters_category_id_user_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."user_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "filters" ADD CONSTRAINT "filters_sub_category_id_user_sub_categories_id_fk" FOREIGN KEY ("sub_category_id") REFERENCES "public"."user_sub_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "filters" ADD CONSTRAINT "filters_forked_from_id_filters_id_fk" FOREIGN KEY ("forked_from_id") REFERENCES "public"."filters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "filters" ADD CONSTRAINT "filters_output_container_id_items_id_fk" FOREIGN KEY ("output_container_id") REFERENCES "public"."items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shared_filters" ADD CONSTRAINT "shared_filters_filter_id_filters_id_fk" FOREIGN KEY ("filter_id") REFERENCES "public"."filters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shared_filters" ADD CONSTRAINT "shared_filters_share_token_id_share_token_id_fk" FOREIGN KEY ("share_token_id") REFERENCES "public"."share_token"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sub_categories" ADD CONSTRAINT "user_sub_categories_parent_id_user_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."user_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "donations_user_idx" ON "donations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "donations_email_idx" ON "donations" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_idx" ON "filter_items" USING btree ("item_id","filter_id");--> statement-breakpoint
CREATE UNIQUE INDEX "filter_tag_unique" ON "filter_tag_assignments" USING btree ("filter_id","tag_id");--> statement-breakpoint
CREATE INDEX "filter_tag_filter_idx" ON "filter_tag_assignments" USING btree ("filter_id","rank");--> statement-breakpoint
CREATE INDEX "filter_tag_tag_idx" ON "filter_tag_assignments" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "filter_tag_proposal_slug_idx" ON "filter_tag_proposals" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "filter_tag_proposal_status_idx" ON "filter_tag_proposals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "filter_tags_status_idx" ON "filter_tags" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "filters_id_idx" ON "filters" USING btree ("id");--> statement-breakpoint
CREATE INDEX "filters_popularity_idx" ON "filters" USING btree ("popularity_score" DESC NULLS LAST,"id");--> statement-breakpoint
CREATE INDEX "filters_created_at_idx" ON "filters" USING btree ("created_at" DESC NULLS LAST,"id");--> statement-breakpoint
CREATE INDEX "filters_updated_at_idx" ON "filters" USING btree ("updated_at" DESC NULLS LAST,"id");--> statement-breakpoint
CREATE INDEX "filters_export_count_idx" ON "filters" USING btree ("export_count" DESC NULLS LAST,"id");--> statement-breakpoint
CREATE INDEX "filters_search_idx" ON "filters" USING gin ("search_vector");--> statement-breakpoint
CREATE INDEX "filters_ai_status_idx" ON "filters" USING btree ("ai_categorization_status");--> statement-breakpoint
CREATE INDEX "filters_forked_from_idx" ON "filters" USING btree ("forked_from_id");--> statement-breakpoint
CREATE INDEX "subscriptions_clerk_user_idx" ON "subscriptions" USING btree ("clerk_user_id");--> statement-breakpoint
CREATE INDEX "subscriptions_status_idx" ON "subscriptions" USING btree ("status");
--> statement-breakpoint
CREATE FUNCTION public.update_filter_search_vector(p_filter_id integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE filters 
  SET search_vector = (
    setweight(to_tsvector('english', coalesce(filters.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(filters.description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce((
      SELECT string_agg(i.name, ' ')  -- Only item names, no shortnames
      FROM filter_items fi
      JOIN items i ON fi.item_id = i.id
      WHERE fi.filter_id = p_filter_id
    ), '')), 'C') ||
    setweight(to_tsvector('english', coalesce((
      SELECT string_agg(DISTINCT i.category, ' ')  -- Unique categories only
      FROM filter_items fi
      JOIN items i ON fi.item_id = i.id
      WHERE fi.filter_id = p_filter_id
    ), '')), 'D')
  )
  WHERE filters.id = p_filter_id;
END;
$$;
--> statement-breakpoint
CREATE FUNCTION public.trigger_update_filter_search_vector() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  PERFORM update_filter_search_vector(NEW.id);
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE FUNCTION public.trigger_update_filter_search_vector_from_items() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM update_filter_search_vector(OLD.filter_id);
    RETURN OLD;
  ELSE
    PERFORM update_filter_search_vector(NEW.filter_id);
    RETURN NEW;
  END IF;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER update_filter_search_vector_trigger AFTER INSERT OR UPDATE OF name, description ON public.filters FOR EACH ROW EXECUTE FUNCTION public.trigger_update_filter_search_vector();
--> statement-breakpoint
CREATE TRIGGER update_filter_search_vector_from_items_trigger AFTER INSERT OR DELETE OR UPDATE ON public.filter_items FOR EACH ROW EXECUTE FUNCTION public.trigger_update_filter_search_vector_from_items();