// Imports sample live classes without replacing edited rows.
// Usage: pnpm db:seed:classes
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { sampleLiveClasses } from "../src/modules/classes/sample-data.ts";
import { liveClasses } from "../src/server/db/schema/index.ts";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
const conn = postgres(process.env.DATABASE_URL, { max: 1 });
const db = drizzle(conn);

try {
  for (const item of sampleLiveClasses) {
    await db
      .insert(liveClasses)
      .values(item)
      .onConflictDoNothing({ target: liveClasses.slug });
  }
  console.log(
    `Live classes seeded: ${sampleLiveClasses.length} sessions imported without replacing existing rows.`,
  );
} finally {
  await conn.end();
}
