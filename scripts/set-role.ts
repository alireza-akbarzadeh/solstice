// Promotes (or demotes) an account, so the first instructor can be made without any UI.
// Usage: pnpm role <email>              — make this account an instructor
//        pnpm role <email> member       — hand it back to a plain member
//        pnpm role --list               — show every account and its role
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { user } from "../src/server/db/schema.ts";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set (run with --env-file=.env)");

const args = process.argv.slice(2).filter((a) => a !== "--");
const conn = postgres(url, { max: 1 });
const db = drizzle(conn);

try {
  if (args.length === 0 || args[0] === "--list") {
    const rows = await db.select({ email: user.email, name: user.name, role: user.role }).from(user).orderBy(user.createdAt);
    if (rows.length === 0) console.log("No accounts yet — sign up at /sign-up first.");
    for (const r of rows) console.log(`${r.role === "instructor" ? "★" : " "} ${r.role.padEnd(10)} ${r.email}  (${r.name})`);
    if (args.length === 0) console.log("\nUsage: pnpm role <email> [member|instructor]");
  } else {
    const email = args[0]!.trim().toLowerCase();
    const role = args[1] === "member" ? "member" : "instructor";

    const rows = await db.update(user).set({ role }).where(eq(user.email, email)).returning({ email: user.email, role: user.role });
    if (rows.length === 0) {
      console.error(`No account with the email ${email}. Run \`pnpm role --list\` to see what exists.`);
      process.exitCode = 1;
    } else {
      console.log(`${rows[0]!.email} is now ${rows[0]!.role}.`);
      if (role === "instructor") console.log("Open /instructor — the studio also appears in the account menu.");
    }
  }
} finally {
  await conn.end();
}
