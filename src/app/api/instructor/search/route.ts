import { NextResponse } from "next/server";

import { routing } from "@/i18n/routing";
import { searchStudio } from "@/modules/instructor/server/search";
import { getSession } from "@/server/better-auth/server";

// The command palette searches as the instructor types. A GET handler rather than a server
// action: actions run one at a time per tab, while these run in parallel and can be aborted.
export async function GET(request: Request) {
  const session = await getSession();
  if (session?.user.role !== "instructor") return new NextResponse(null, { status: 404 });

  const params = new URL(request.url).searchParams;
  const locale = routing.locales.find((l) => l === params.get("locale")) ?? routing.defaultLocale;
  const hits = await searchStudio(params.get("q") ?? "", locale);
  return NextResponse.json(hits, { headers: { "Cache-Control": "private, no-store" } });
}
