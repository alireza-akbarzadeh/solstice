import { desc, eq } from "drizzle-orm";
import { cache } from "react";

import { db } from "@/server/db";
import { programs } from "@/server/db/schema";

export type ProgramRow = typeof programs.$inferSelect;

export const getProgramRows = cache(async () =>
  db
    .select()
    .from(programs)
    .orderBy(desc(programs.createdAt), desc(programs.slug)),
);
export const getPublishedProgramRows = cache(async () =>
  (await getProgramRows()).filter((p) => p.status === "published"),
);

export async function getProgramRow(slug: string) {
  const [row] = await db
    .select()
    .from(programs)
    .where(eq(programs.slug, slug))
    .limit(1);
  return row ?? null;
}
