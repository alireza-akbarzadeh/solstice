// One-time bridge for a database built before the migration journal was complete (with
// `drizzle-kit push` and the db:seed:* scripts): gives the constraints those scripts created the
// names drizzle's migrations use, then records every migration in drizzle/ as applied, so
// `pnpm db:migrate` takes over from here. Safe to re-run; does nothing on a migrated database.
// Run with --dry-run to print what it would do.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import postgres from "postgres";

const dryRun = process.argv.includes("--dry-run");

/** [table, name the seed scripts' DDL produced, name drizzle's migrations use]. */
const renames: [string, string, string][] = [
  ["solstice_category", "solstice_category_pkey", "solstice_category_kind_slug_pk"],
  ["solstice_payment_event", "solstice_payment_event_pkey", "solstice_payment_event_provider_eventId_pk"],
  ["solstice_practice_like", "solstice_practice_like_pkey", "solstice_practice_like_userId_practiceSlug_pk"],
  ["solstice_checkout", "solstice_checkout_userId_fkey", "solstice_checkout_userId_user_id_fk"],
  ["solstice_payment", "solstice_payment_userId_fkey", "solstice_payment_userId_user_id_fk"],
  ["solstice_practice_like", "solstice_practice_like_userId_fkey", "solstice_practice_like_userId_user_id_fk"],
];

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
const sql = postgres(process.env.DATABASE_URL, { max: 1, onnotice: () => {} });
const run = async (statement: string) => {
  console.log(`${dryRun ? "[dry run] " : ""}${statement}`);
  if (!dryRun) await sql.unsafe(statement);
};

try {
  const existing = new Set(
    (await sql`select conname from pg_constraint where connamespace = 'public'::regnamespace`).map((r) => r.conname as string),
  );
  for (const [table, from, to] of renames) {
    if (existing.has(from) && !existing.has(to)) await run(`ALTER TABLE "${table}" RENAME CONSTRAINT "${from}" TO "${to}"`);
  }

  // The same bookkeeping drizzle-orm's migrator keeps: one row per migration, hashed the same way.
  await run(`CREATE SCHEMA IF NOT EXISTS "drizzle"`);
  await run(`CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (id SERIAL PRIMARY KEY, hash text NOT NULL, created_at bigint)`);
  const journal = JSON.parse(readFileSync("drizzle/meta/_journal.json", "utf8")) as { entries: { tag: string; when: number }[] };
  const recorded = dryRun
    ? new Set<string>()
    : new Set((await sql`select hash from "drizzle"."__drizzle_migrations"`).map((r) => r.hash as string));
  for (const { tag, when } of journal.entries) {
    const hash = createHash("sha256").update(readFileSync(`drizzle/${tag}.sql`, "utf8")).digest("hex");
    if (recorded.has(hash)) continue;
    await run(`INSERT INTO "drizzle"."__drizzle_migrations" (hash, created_at) VALUES ('${hash}', ${when}) -- ${tag}`);
  }
  console.log(dryRun ? "Dry run: nothing changed." : "Baseline recorded: `pnpm db:migrate` now starts after the latest migration.");
} finally {
  await sql.end();
}
