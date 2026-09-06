CREATE TABLE "visit_counts" (
	"visit_date" date PRIMARY KEY NOT NULL,
	"count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "visit_counts" ENABLE ROW LEVEL SECURITY;
