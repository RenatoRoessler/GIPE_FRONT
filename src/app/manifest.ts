import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GIPE — Gestão Inteligente para Estacionamentos",
    short_name: "GIPE",
    description: "Sistema de gestão de estacionamentos.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    lang: "pt-BR",
    background_color: "#FFFFFF",
    theme_color: "#2C5CE0",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
