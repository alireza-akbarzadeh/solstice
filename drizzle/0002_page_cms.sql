CREATE TABLE IF NOT EXISTS "solstice_site_page" (
  "slug" text PRIMARY KEY,
  "builtin" boolean NOT NULL DEFAULT false,
  "draftContent" jsonb NOT NULL,
  "publishedContent" jsonb,
  "publishedAt" timestamptz,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "site_page_builtin_idx" ON "solstice_site_page" ("builtin");
