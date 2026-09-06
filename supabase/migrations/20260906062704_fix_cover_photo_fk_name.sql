ALTER TABLE "diary_entries" DROP CONSTRAINT "diary_entries_cover_photo_fk";
--> statement-breakpoint
ALTER TABLE "diary_entries" ADD CONSTRAINT "diary_entries_cover_photo_id_diary_photos_id_fk" FOREIGN KEY ("cover_photo_id") REFERENCES "public"."diary_photos"("id") ON DELETE set null ON UPDATE no action;