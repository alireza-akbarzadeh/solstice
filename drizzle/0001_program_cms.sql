CREATE TABLE IF NOT EXISTS "solstice_program" (
  "slug" text PRIMARY KEY,
  "status" text NOT NULL DEFAULT 'draft',
  "featured" boolean NOT NULL DEFAULT false,
  "title" jsonb NOT NULL,
  "description" jsonb NOT NULL,
  "heroTitle" jsonb NOT NULL,
  "lede" jsonb NOT NULL,
  "badge" jsonb NOT NULL,
  "cta" jsonb NOT NULL,
  "note" jsonb NOT NULL,
  "image" text NOT NULL,
  "imageAlt" jsonb NOT NULL,
  "tone" text NOT NULL DEFAULT 'primary',
  "icon" text NOT NULL DEFAULT 'sunrise',
  "pacing" text NOT NULL DEFAULT 'self',
  "weeks" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "publishedAt" timestamptz,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "program_status_idx" ON "solstice_program" ("status");
