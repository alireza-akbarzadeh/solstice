import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL);
try {
  const plans = await sql`SELECT id, name, prices, "trialDays", status FROM solstice_membership_plan`;
  console.log("PLANS IN DB:", JSON.stringify(plans, null, 2));
} finally {
  await sql.end();
}
