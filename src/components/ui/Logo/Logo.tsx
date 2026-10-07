"use client";

import Image from "next/image";
import { useThemeMode } from "@/contexts/ThemeModeContext";
import { LogoWrapper } from "./Logo.styles";

// Centraliza-se dentro de um container flex em coluna (ex.: cabeçalho de cartão).
export function Logo() {
  const { mode } = useThemeMode();

  return (
    <LogoWrapper $onDark={mode === "dark"}>
      <Image
        src="/assets/gipe-logo.png"
        alt="GIPE — Gestão Inteligente de Estacionamentos"
        width={173}
        height={56}
        priority
      />
    </LogoWrapper>
  );
}
