CREATE TYPE "public"."subscription_interval_enum" AS ENUM('monthly', 'yearly');--> statement-breakpoint
CREATE TYPE "public"."subscription_status_enum" AS ENUM('active', 'canceled', 'refunded', 'chargeback');--> statement-breakpoint
CREATE TABLE "paynow_customers" (
	"clerk_user_id" varchar(255) PRIMARY KEY NOT NULL,
	"paynow_customer_id" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "paynow_customers_paynow_customer_id_unique" UNIQUE("paynow_customer_id")
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
CREATE INDEX "subscriptions_clerk_user_idx" ON "subscriptions" USING btree ("clerk_user_id");--> statement-breakpoint
CREATE INDEX "subscriptions_status_idx" ON "subscriptions" USING btree ("status");