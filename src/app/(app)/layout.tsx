import { ReactNode } from "react";
import { Barlow, Barlow_Condensed } from "next/font/google";
import { AppShell } from "@/components/layout/AppShell";
import { SignageThemeProvider } from "@/contexts/ThemeModeContext";
import { FontScope } from "./FontScope";

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

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SignageThemeProvider>
      <FontScope className={`${barlow.variable} ${barlowCondensed.variable}`}>
        <AppShell>{children}</AppShell>
      </FontScope>
    </SignageThemeProvider>
  );
}
