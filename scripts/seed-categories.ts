// Creates the category table and imports the original practice and journal categories without
// replacing anything the studio has edited. Safe to re-run.
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { defaultCategories } from "../src/modules/categories/types.ts";
import { categories } from "../src/server/db/schema/index.ts";

const TABLE = `
CREATE TABLE IF NOT EXISTS "solstice_category" (
  "kind" text NOT NULL,
  "slug" text NOT NULL,
  "name" jsonb NOT NULL,
  "sortOrder" integer NOT NULL DEFAULT 0,
  "visible" boolean NOT NULL DEFAULT true,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("kind", "slug")
);
`;

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
const conn = postgres(process.env.DATABASE_URL, { max: 1, onnotice: () => {} });
const db = drizzle(conn);
try {
  await conn.unsafe(TABLE);
  const imported = await db.insert(categories).values(defaultCategories).onConflictDoNothing().returning({ slug: categories.slug });
  console.log(`Categories ready: ${imported.length} imported, ${defaultCategories.length - imported.length} already present.`);
} finally {
  await conn.end();
}
