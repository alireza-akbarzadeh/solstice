import { NextResponse } from "next/server";

import { env } from "@/env";
import { routing } from "@/i18n/routing";
import { providerFor } from "@/infrastructure/video";
import { getViewer } from "@/modules/memberships/server/viewer";
import { resolvePracticeAccess } from "@/modules/practices/server/access";
import { getPractice } from "@/modules/practices/server/get-practice";

// "Download" on the practice page: the whole video as a file, for anyone allowed to watch all of
// it (open practices, members). Streamed through here because the media usually lives on
// another origin, where a plain <a download> would just open it in a tab.
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [practice, viewer] = await Promise.all([getPractice(routing.defaultLocale, slug), getViewer()]);
  if (!practice) return new NextResponse(null, { status: 404 });
  if (resolvePracticeAccess(practice, viewer).mode !== "full") return new NextResponse(null, { status: 403 });

  const playback = await providerFor(practice.videoProvider).getPlayback(practice.videoAssetId, { kind: "full" });
  // Embeds (YouTube, Aparat) belong to their platform and can't be downloaded from here.
  if (playback.kind !== "file") return new NextResponse(null, { status: 404 });

  const upstream = await fetch(new URL(playback.src, env.BETTER_AUTH_URL));
  if (!upstream.ok || !upstream.body) return new NextResponse(null, { status: 502 });

  const type = upstream.headers.get("content-type") ?? "video/mp4";
  const extension = type.includes("webm") ? "webm" : "mp4";
  const headers = new Headers({
    "Content-Type": type,
    "Content-Disposition": `attachment; filename="${practice.slug}.${extension}"`,
    "Cache-Control": "private, no-store",
  });
  const length = upstream.headers.get("content-length");
  if (length) headers.set("Content-Length", length);
  return new NextResponse(upstream.body, { headers });
}
