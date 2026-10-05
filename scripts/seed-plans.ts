// Creates the membership plan and settings tables, then imports the two original plans
// (monthly $24, annual $220, 14-day trial) without replacing anything the studio has edited.
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { membershipPlans, settings } from "../src/server/db/schema/index.ts";

// The original plans and their copy, as the membership page showed them before plans moved
// into the database. Edit plans at /instructor/plans, not here.
const features = [
  { en: "140+ cinematic practices", fa: "بیش از ۱۴۰ تمرین سینمایی" },
  { en: "Offline downloads in the app", fa: "دانلود آفلاین در اپ" },
  {
    en: "Live Sunday Satsangs with Elena",
    fa: "ست‌سنگ‌های زندهٔ یکشنبه با النا",
  },
  { en: "All structured immersions", fa: "همهٔ برنامه‌های غوطه‌وری" },
];
const rows = [
  {
    id: "annual",
    sortOrder: 0,
    featured: true,
    name: { en: "Annual Sanctuary Pass", fa: "گذرنامهٔ سالانهٔ پناهگاه" },
    description: {
      en: "An uninterrupted year of mindful somatic alignment and seasonal retreats.",
      fa: "یک سال پیوسته هم‌ترازی سوماتیک آگاهانه و خلوت‌های فصلی.",
    },
    badge: { en: "Recommended · Save 24%", fa: "پیشنهادی · ۲۴٪ صرفه‌جویی" },
    features,
    price: 220,
    intervalMonths: 12,
    trialDays: 14,
  },
  {
    id: "monthly",
    sortOrder: 1,
    featured: false,
    name: { en: "Monthly Sanctuary Pass", fa: "گذرنامهٔ ماهانهٔ پناهگاه" },
    description: {
      en: "Complete freedom to practice month by month. Pause or cancel in one click.",
      fa: "آزادی کامل برای تمرین ماه به ماه. توقف یا لغو با یک کلیک.",
    },
    badge: { en: "", fa: "" },
    features,
    price: 24,
    intervalMonths: 1,
    trialDays: 14,
  },
];

const TABLES = `
CREATE TABLE IF NOT EXISTS "solstice_membership_plan" (
  "id" text PRIMARY KEY,
  "status" text NOT NULL DEFAULT 'active',
  "featured" boolean NOT NULL DEFAULT false,
  "sortOrder" integer NOT NULL DEFAULT 0,
  "name" jsonb NOT NULL,
  "description" jsonb NOT NULL,
  "badge" jsonb NOT NULL,
  "features" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "price" numeric(14, 2) NOT NULL,
  "intervalMonths" integer NOT NULL,
  "trialDays" integer NOT NULL DEFAULT 0,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "membership_plan_status_idx" ON "solstice_membership_plan" ("status");
CREATE TABLE IF NOT EXISTS "solstice_setting" (
  "key" text PRIMARY KEY,
  "value" jsonb NOT NULL,
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);
`;

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
const conn = postgres(process.env.DATABASE_URL, { max: 1, onnotice: () => {} });
const db = drizzle(conn);
try {
  await conn.unsafe(TABLES);
  const imported = await db
    .insert(membershipPlans)
    .values(rows)
    .onConflictDoNothing()
    .returning({ id: membershipPlans.id });
  await db
    .insert(settings)
    .values({ key: "billing", value: { currency: "USD" } })
    .onConflictDoNothing();
  console.log(
    `Membership plans ready: ${imported.length} imported, ${rows.length - imported.length} already present.`,
  );
} finally {
  await conn.end();
}
