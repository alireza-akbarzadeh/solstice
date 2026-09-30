// Seeds solstice_practice from the sample practices the site was designed with.
// Usage: pnpm db:seed            — adds missing practices, never touches edited ones
//        pnpm db:seed --reset    — overwrites every sample practice with the sample content
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { samplePractices } from "../src/modules/practices/sample-data.ts";
import { samplePracticeDetails } from "../src/modules/practices/sample-details.ts";
import { practices } from "../src/server/db/schema.ts";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set (run with --env-file=.env)");
const reset = process.argv.includes("--reset");

const conn = postgres(url, { max: 1 });
const db = drizzle(conn);

// Library order follows the sample order (createdAt ascending).
const start = Date.now();
const rows = samplePractices.map((p, i) => {
  const detail = samplePracticeDetails[p.slug];
  return {
    slug: p.slug,
    status: "published" as const,
    featured: p.featured,
    title: p.title,
    summary: p.summary,
    series: p.series,
    category: p.category,
    intensityLevel: p.intensity.level,
    intensityLabel: p.intensity.label,
    props: p.props,
    durationMinutes: p.durationMinutes,
    rating: p.rating,
    reviewCount: p.reviewCount,
    access: p.access,
    previewSeconds: p.previewSeconds ?? null,
    image: p.image,
    imageAlt: p.imageAlt,
    poster: detail?.poster ?? null,
    instructorNote: detail?.instructorNote ?? null,
    focus: detail?.focus ?? [],
    implements: detail?.implements ?? [],
    chapters: detail?.chapters ?? [],
    publishedAt: new Date(start),
    createdAt: new Date(start + i * 1000),
  };
});

for (const row of rows) {
  const insert = db.insert(practices).values(row);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- the slug is the conflict target
  const { slug, ...rest } = row;
  await (reset ? insert.onConflictDoUpdate({ target: practices.slug, set: rest }) : insert.onConflictDoNothing());
}

console.log(`${reset ? "Reset" : "Seeded"} ${rows.length} practices.`);
await conn.end();
