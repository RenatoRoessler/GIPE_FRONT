import type { NextConfig } from "next";
import { generateChangelog } from "./scripts/generate-changelog.mjs";

// Gera a versão e o changelog a partir do git antes de qualquer compilação (dev, build e start).
generateChangelog();

const nextConfig: NextConfig = {
  compiler: {
    styledComponents: true,
  },
};

export default nextConfig;
