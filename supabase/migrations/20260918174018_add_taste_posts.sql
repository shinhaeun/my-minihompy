CREATE TABLE "taste_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" text,
	"title" text NOT NULL,
	"blocks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"visibility" text DEFAULT 'public' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "taste_posts_visibility_check" CHECK ("taste_posts"."visibility" in ('public', 'private'))
);
--> statement-breakpoint
CREATE INDEX "taste_posts_created_at_idx" ON "taste_posts" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "taste_posts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

-- 본문에 끼워넣는 사진 저장소 (일기 사진과 같이 비공개 — 서버가 서명 URL로만 내려준다)
INSERT INTO storage.buckets (id, name, public)
VALUES ('taste-images', 'taste-images', false)
ON CONFLICT (id) DO NOTHING;