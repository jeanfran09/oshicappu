import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Oshicappu",
    short_name: "Oshicappu",
    description: "Social Media App for Oshikatsu",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    icons: [
      {
        src: "/icons/temp.jpg",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/temp.jpg",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}