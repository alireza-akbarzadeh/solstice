// Adds the program table and imports the existing sample curriculum without replacing edits.
// Usage: pnpm db:seed:programs
import { readFile } from "node:fs/promises";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { samplePrograms } from "../src/modules/programs/sample-data.ts";
import { programs } from "../src/server/db/schema.ts";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
const conn = postgres(process.env.DATABASE_URL, { max: 1 });
const db = drizzle(conn);
try {
  const migration = await readFile(
    new URL("../drizzle/0001_program_cms.sql", import.meta.url),
    "utf8",
  );
  await conn.unsafe(migration);
  for (const program of samplePrograms) {
    await db
      .insert(programs)
      .values({ ...program, status: "published", publishedAt: new Date() })
      .onConflictDoNothing();
  }
  console.log(
    `Program table ready; ${samplePrograms.length} sample programs imported without replacing existing rows.`,
  );
} finally {
  await conn.end();
}
