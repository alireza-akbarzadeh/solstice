import { NextResponse } from "next/server";

import { env } from "@/env";
import { sendRenewalReminders } from "@/modules/memberships/server/renewal-reminders";

// Daily job (vercel.json "crons"). Vercel calls it with "Authorization: Bearer $CRON_SECRET";
// without a secret configured it only runs in development, so nobody can trigger mail at will.
export async function GET(request: Request) {
  const authorized = env.CRON_SECRET
    ? request.headers.get("authorization") === `Bearer ${env.CRON_SECRET}`
    : env.NODE_ENV === "development";
  if (!authorized) return new NextResponse(null, { status: 401 });

  return NextResponse.json(await sendRenewalReminders());
}
