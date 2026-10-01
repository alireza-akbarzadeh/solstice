import type { MetadataRoute } from "next";

import en from "../../messages/en.json";

// Served at /manifest.webmanifest. Makes Arte Yoga Studio installable (Add to Home Screen).
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: en.Metadata.title,
    short_name: en.Brand.name,
    description: en.Pwa.description,
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
