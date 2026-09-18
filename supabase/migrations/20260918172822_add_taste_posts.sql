CREATE TABLE "taste_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"visibility" text DEFAULT 'public' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "taste_posts_visibility_check" CHECK ("taste_posts"."visibility" in ('public', 'private'))
);
--> statement-breakpoint
CREATE INDEX "taste_posts_created_at_idx" ON "taste_posts" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "taste_posts" ENABLE ROW LEVEL SECURITY;