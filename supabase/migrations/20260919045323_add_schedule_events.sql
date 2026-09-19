CREATE TABLE "schedule_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_date" date NOT NULL,
	"start_time" text,
	"title" text NOT NULL,
	"memo" text,
	"color" text DEFAULT 'purple' NOT NULL,
	"visibility" text DEFAULT 'public' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "schedule_events_visibility_check" CHECK ("schedule_events"."visibility" in ('public', 'private'))
);
--> statement-breakpoint
CREATE INDEX "schedule_events_event_date_idx" ON "schedule_events" USING btree ("event_date");--> statement-breakpoint
ALTER TABLE "schedule_events" ENABLE ROW LEVEL SECURITY;
