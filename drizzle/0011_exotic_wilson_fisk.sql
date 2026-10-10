CREATE TABLE "solstice_playlist_item" (
	"playlistId" text NOT NULL,
	"practiceSlug" text NOT NULL,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"addedAt" timestamp with time zone NOT NULL,
	CONSTRAINT "solstice_playlist_item_playlistId_practiceSlug_pk" PRIMARY KEY("playlistId","practiceSlug")
);
--> statement-breakpoint
CREATE TABLE "solstice_playlist" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "solstice_playlist_item" ADD CONSTRAINT "solstice_playlist_item_playlistId_solstice_playlist_id_fk" FOREIGN KEY ("playlistId") REFERENCES "public"."solstice_playlist"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solstice_playlist_item" ADD CONSTRAINT "solstice_playlist_item_practiceSlug_solstice_practice_slug_fk" FOREIGN KEY ("practiceSlug") REFERENCES "public"."solstice_practice"("slug") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solstice_playlist" ADD CONSTRAINT "solstice_playlist_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "playlist_item_playlist_idx" ON "solstice_playlist_item" USING btree ("playlistId","sortOrder");--> statement-breakpoint
CREATE INDEX "playlist_user_idx" ON "solstice_playlist" USING btree ("userId","createdAt");