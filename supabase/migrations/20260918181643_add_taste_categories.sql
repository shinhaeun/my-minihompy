ALTER TABLE "taste_posts" DROP COLUMN "category";
--> statement-breakpoint
CREATE TABLE "taste_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT 'pink' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "taste_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "taste_posts" ADD COLUMN "category_id" uuid;--> statement-breakpoint
ALTER TABLE "taste_posts" ADD CONSTRAINT "taste_posts_category_id_taste_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."taste_categories"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "taste_categories" ENABLE ROW LEVEL SECURITY;
