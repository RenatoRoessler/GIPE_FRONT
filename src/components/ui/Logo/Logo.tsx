"use client";

import Image from "next/image";
import { useThemeMode } from "@/contexts/ThemeModeContext";
import { LogoWrapper } from "./Logo.styles";

// Centraliza-se dentro de um container flex em coluna (ex.: cabeçalho de cartão).
export interface LogoProps {
  align?: "center" | "start";
}

export function Logo({ align = "center" }: LogoProps) {
  const { mode } = useThemeMode();

  return (
    <LogoWrapper $align={align}>
      <Image
        src={mode === "dark" ? "/assets/gipe-logo-azul-dark.png" : "/assets/gipe-logo-azul.png"}
        alt="GIPE — Gestão Inteligente para Estacionamentos"
        width={260}
        height={118}
        priority
      />
    </LogoWrapper>
  );
}
