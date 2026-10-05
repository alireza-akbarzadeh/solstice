// Creates the additive page table and imports existing copy without replacing instructor edits.
import { readFile } from "node:fs/promises";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  pageDefinitions,
  defaultPageContent,
} from "../src/modules/pages/definitions.ts";
import type { CopyRecord } from "../src/modules/pages/types.ts";
import { sitePages } from "../src/server/db/schema/index.ts";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
const conn = postgres(process.env.DATABASE_URL, { max: 1 });
const db = drizzle(conn);
try {
  const [migration, en, fa] = await Promise.all([
    readFile(new URL("../drizzle/0002_page_cms.sql", import.meta.url), "utf8"),
    readFile(new URL("../messages/en.json", import.meta.url), "utf8"),
    readFile(new URL("../messages/fa.json", import.meta.url), "utf8"),
  ]);
  await conn.unsafe(migration);
  const messages = {
    en: JSON.parse(en) as CopyRecord,
    fa: JSON.parse(fa) as CopyRecord,
  };
  let imported = 0;
  for (const definition of pageDefinitions) {
    const content = defaultPageContent(definition, messages);
    const rows = await db
      .insert(sitePages)
      .values({
        slug: definition.slug,
        builtin: true,
        draftContent: content,
        publishedContent: content,
        publishedAt: new Date(),
      })
      .onConflictDoNothing()
      .returning({ slug: sitePages.slug });
    imported += rows.length;
  }
  console.log(
    `Page table ready; ${imported} website pages imported without replacing existing edits.`,
  );
} finally {
  await conn.end();
}
