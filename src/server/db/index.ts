import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "@/env";
import * as schema from "./schema";

/**
 * Cache the database connection in development. This avoids creating a new connection on every HMR
 * update.
 */
const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
};

/**
 * Neon suspends an idle compute (scale to zero) and closes idle pooled connections, so a
 * connection held open across a quiet spell can be dead by the next request — which surfaces as
 * a failed query on whatever ran first, usually the Better Auth session lookup in a layout.
 * Retiring our own connections before Neon does, and allowing for a cold start, avoids that.
 */
const conn =
  globalForDb.conn ??
  postgres(env.DATABASE_URL, {
    max: 10,
    idle_timeout: 20,
    max_lifetime: 60 * 30,
    connect_timeout: 30,
  });
if (env.NODE_ENV !== "production") globalForDb.conn = conn;

export const db = drizzle(conn, { schema });
