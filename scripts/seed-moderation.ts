// Adds comment moderation (solstice_comment.status) to an existing database. Existing
// reflections become "approved", so nothing already public disappears. Safe to re-run.
import postgres from "postgres";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
const conn = postgres(process.env.DATABASE_URL, { max: 1, onnotice: () => {} });
try {
  await conn.unsafe(`
    ALTER TABLE "solstice_comment" ADD COLUMN IF NOT EXISTS "status" text NOT NULL DEFAULT 'approved';
    CREATE INDEX IF NOT EXISTS "comment_status_idx" ON "solstice_comment" ("status");
  `);
  const [row] = await conn`select count(*) filter (where status = 'pending')::int as pending, count(*)::int as total from solstice_comment`;
  console.log(`Comment moderation ready: ${row?.total ?? 0} reflections, ${row?.pending ?? 0} awaiting approval.`);
} finally {
  await conn.end();
}
