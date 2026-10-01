// Seeds solstice_journal_article from the sample essays the journal was designed with.
// Usage: pnpm db:seed:journal            — adds missing essays, never touches edited ones
//        pnpm db:seed:journal --reset    — overwrites every sample essay with the sample content
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { sampleArticles, sampleAuthors } from "../src/modules/journal/sample-articles.ts";
import { journalArticles } from "../src/server/db/schema.ts";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set (run with --env-file=.env)");
const reset = process.argv.includes("--reset");

const conn = postgres(url, { max: 1 });
const db = drizzle(conn);

const rows = sampleArticles.map((article) => {
  const author = sampleAuthors[article.author];
  return {
    slug: article.slug,
    status: "published" as const,
    featured: article.featured ?? false,
    category: article.category,
    issue: article.issue,
    title: article.title,
    excerpt: article.excerpt,
    tags: article.tags,
    authorName: author.name,
    authorRole: author.role,
    authorImage: author.image,
    image: article.image,
    imageAlt: article.imageAlt,
    body: article.body,
    practices: article.practices,
    publishedAt: new Date(`${article.publishedAt}T09:00:00Z`),
  };
});

for (const row of rows) {
  const insert = db.insert(journalArticles).values(row);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- the slug is the conflict target
  const { slug, ...rest } = row;
  await (reset ? insert.onConflictDoUpdate({ target: journalArticles.slug, set: rest }) : insert.onConflictDoNothing());
}

console.log(`${reset ? "Reset" : "Seeded"} ${rows.length} essays.`);
await conn.end();
