import { pgTableCreator } from "drizzle-orm/pg-core";

// Every app table is prefixed "solstice_"; Better Auth's own tables (auth.ts) keep their names.

export const createTable = pgTableCreator((name) => `solstice_${name}`);
