import { NextResponse } from "next/server";

import { env } from "@/env";
import { runPracticeRemindersCron } from "@/modules/reminders/server/nudges";

// Daily job (vercel.json "crons"). Vercel calls it with "Authorization: Bearer $CRON_SECRET";
// without a secret configured it only runs in development.
export async function GET(request: Request) {
  const authorized = env.CRON_SECRET
    ? request.headers.get("authorization") === `Bearer ${env.CRON_SECRET}`
    : env.NODE_ENV === "development";
  if (!authorized) return new NextResponse(null, { status: 401 });

  const result = await runPracticeRemindersCron();
  return NextResponse.json(result);
}
