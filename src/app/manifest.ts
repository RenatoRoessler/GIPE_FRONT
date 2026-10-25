import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Murel",
    short_name: "Murel",
    description: "Controle de entrada, saída e caixa de estacionamentos, valets e lava-rápidos.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    lang: "pt-BR",
    background_color: "#0E1729",
    theme_color: "#0E1729",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
