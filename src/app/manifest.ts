import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tether Vault",
    short_name: "Tether",
    description: "Private markdown vault synced from one GitHub repository.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f7f1e7",
    theme_color: "#193044",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
