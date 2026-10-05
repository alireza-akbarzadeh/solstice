CREATE TABLE "solstice_journal_article" (
	"slug" text PRIMARY KEY NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"category" text NOT NULL,
	"issue" integer DEFAULT 1 NOT NULL,
	"title" jsonb NOT NULL,
	"excerpt" jsonb NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"authorName" jsonb NOT NULL,
	"authorRole" jsonb NOT NULL,
	"authorImage" text,
	"image" text NOT NULL,
	"imageAlt" jsonb NOT NULL,
	"body" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"practices" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"publishedAt" timestamp with time zone,
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "solstice_program" (
	"slug" text PRIMARY KEY NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"title" jsonb NOT NULL,
	"description" jsonb NOT NULL,
	"heroTitle" jsonb NOT NULL,
	"lede" jsonb NOT NULL,
	"badge" jsonb NOT NULL,
	"cta" jsonb NOT NULL,
	"note" jsonb NOT NULL,
	"image" text NOT NULL,
	"imageAlt" jsonb NOT NULL,
	"tone" text DEFAULT 'primary' NOT NULL,
	"icon" text DEFAULT 'sunrise' NOT NULL,
	"pacing" text DEFAULT 'self' NOT NULL,
	"weeks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"publishedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "solstice_site_page" (
	"slug" text PRIMARY KEY NOT NULL,
	"builtin" boolean DEFAULT false NOT NULL,
	"draftContent" jsonb NOT NULL,
	"publishedContent" jsonb,
	"publishedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "solstice_comment" ADD COLUMN "hidden" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "journal_status_idx" ON "solstice_journal_article" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "program_status_idx" ON "solstice_program" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "site_page_builtin_idx" ON "solstice_site_page" USING btree ("builtin");