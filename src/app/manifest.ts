import type { MetadataRoute } from "next";

import { readCopyPath } from "@/modules/pages/definitions";
import { getPublishedMessages } from "@/modules/pages/server/messages";

export const dynamic = "force-dynamic";

// Served at /manifest.webmanifest. Makes Arte Yoga Studio installable (Add to Home Screen).
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const messages = await getPublishedMessages("en");
  const text = (path: string) => readCopyPath(messages, path) as string;
  return {
    id: "/",
    name: text("Metadata.title"),
    short_name: text("Brand.name"),
    description: text("Pwa.description"),
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fef8f4",
    theme_color: "#fef8f4",
    categories: ["health", "fitness", "lifestyle"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
