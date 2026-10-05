// Creates the practice-like table ("held in heart" on the practice page). Additive and safe
// to re-run; there is nothing to import.
import postgres from "postgres";

const TABLES = `
CREATE TABLE IF NOT EXISTS "solstice_practice_like" (
  "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "practiceSlug" text NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("userId", "practiceSlug")
);
CREATE INDEX IF NOT EXISTS "practice_like_slug_idx" ON "solstice_practice_like" ("practiceSlug");
`;

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
const conn = postgres(process.env.DATABASE_URL, { max: 1, onnotice: () => {} });
try {
  await conn.unsafe(TABLES);
  console.log("Practice likes ready: solstice_practice_like.");
} finally {
  await conn.end();
}
