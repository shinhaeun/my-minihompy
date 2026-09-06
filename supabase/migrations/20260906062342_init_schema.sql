CREATE EXTENSION IF NOT EXISTS pgcrypto;
--> statement-breakpoint
CREATE TABLE "diary_entries" (
	"entry_date" date PRIMARY KEY NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"visibility" text DEFAULT 'public' NOT NULL,
	"cover_photo_id" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "diary_entries_visibility_check" CHECK ("diary_entries"."visibility" in ('public', 'private', 'friends'))
);
--> statement-breakpoint
CREATE TABLE "diary_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entry_date" date NOT NULL,
	"url" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guestbook_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text DEFAULT '방문자' NOT NULL,
	"message" text NOT NULL,
	"pinned" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "owner_credentials" (
	"id" smallint PRIMARY KEY DEFAULT 1 NOT NULL,
	"security_question" text NOT NULL,
	"security_answer_hash" text NOT NULL,
	"pin_hash" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "owner_credentials_id_check" CHECK ("owner_credentials"."id" = 1)
);
--> statement-breakpoint
CREATE TABLE "owner_login_attempts" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"ip" text NOT NULL,
	"attempted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile" (
	"id" smallint PRIMARY KEY DEFAULT 1 NOT NULL,
	"name" text,
	"age" text,
	"job" text,
	"intro" text,
	"mini_like" text,
	"mini_color" text,
	"mini_mood" text,
	"photo_url" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profile_id_check" CHECK ("profile"."id" = 1)
);
--> statement-breakpoint
ALTER TABLE "diary_entries" ADD CONSTRAINT "diary_entries_cover_photo_fk" FOREIGN KEY ("cover_photo_id") REFERENCES "public"."diary_photos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diary_photos" ADD CONSTRAINT "diary_photos_entry_date_diary_entries_entry_date_fk" FOREIGN KEY ("entry_date") REFERENCES "public"."diary_entries"("entry_date") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "diary_photos_entry_date_idx" ON "diary_photos" USING btree ("entry_date");--> statement-breakpoint
CREATE INDEX "owner_login_attempts_ip_attempted_at_idx" ON "owner_login_attempts" USING btree ("ip","attempted_at");--> statement-breakpoint
INSERT INTO "profile" (id) VALUES (1);--> statement-breakpoint

-- 전 테이블 RLS 활성화. anon/authenticated 대상 정책을 만들지 않아 deny-all —
-- API가 항상 service_role 키로만 접근하므로 RLS는 방어선 하나를 더 두는 용도.
ALTER TABLE "profile" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "guestbook_entries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "diary_entries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "diary_photos" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "owner_credentials" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "owner_login_attempts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

-- Storage 버킷: profile-photos(public), diary-photos(private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;--> statement-breakpoint

INSERT INTO storage.buckets (id, name, public)
VALUES ('diary-photos', 'diary-photos', false)
ON CONFLICT (id) DO NOTHING;