import type { ReactNode } from "react";
import { Barlow, Barlow_Condensed } from "next/font/google";
import { FontScope } from "@/components/layout/FontScope";
import { SignageThemeProvider } from "@/contexts/ThemeModeContext";

const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

// Página pública do cliente: mesmo tema e fontes da área logada, mas sem menu nem sessão.
export default function ComprovanteLayout({ children }: { children: ReactNode }) {
  return (
    <SignageThemeProvider>
      <FontScope className={`${barlow.variable} ${barlowCondensed.variable}`}>{children}</FontScope>
    </SignageThemeProvider>
  );
}
