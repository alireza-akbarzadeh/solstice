import { asc } from "drizzle-orm";
import { cache } from "react";

import { db } from "@/server/db";
import { practices } from "@/server/db/schema";

import type { PracticeRow } from "./to-summary";

// The library is small (tens of practices), so it's read once per request and filtered in
// memory. Move filtering into SQL when it grows into the hundreds.

/** Every practice, drafts included, in library order. */
export const getPracticeRows = cache(async (): Promise<PracticeRow[]> => {
  return db.select().from(practices).orderBy(asc(practices.createdAt), asc(practices.slug));
});

/** What members see. */
export const getPublishedRows = cache(async () => (await getPracticeRows()).filter((p) => p.status === "published"));
