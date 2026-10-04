import { eq } from "drizzle-orm";
import { cache } from "react";

import { db } from "@/server/db";
import { settings } from "@/server/db/schema";

import { contactSchema } from "../schemas";
import { emptyContact, type StudioContact } from "../types";

const KEY = "contact";

/**
 * The studio's contact details and social links. Nothing saved yet, a row that no longer
 * validates, or a database without `solstice_setting` all read as "nothing to show".
 */
export const getStudioContact = cache(async (): Promise<StudioContact> => {
  try {
    const [row] = await db
      .select({ value: settings.value })
      .from(settings)
      .where(eq(settings.key, KEY))
      .limit(1);
    if (!row) return emptyContact();
    const parsed = contactSchema.safeParse(row.value);
    return parsed.success ? parsed.data : emptyContact();
  } catch (error) {
    console.error("Studio contact details could not be read.", error);
    return emptyContact();
  }
});

export async function saveStudioContact(contact: StudioContact) {
  await db
    .insert(settings)
    .values({ key: KEY, value: contact })
    .onConflictDoUpdate({ target: settings.key, set: { value: contact } });
}
