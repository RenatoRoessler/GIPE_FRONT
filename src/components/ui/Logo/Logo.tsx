"use client";

import { LogoWrapper, Word } from "./Logo.styles";
import { MurelSymbol, type MurelSymbolTone } from "./MurelSymbol";

// Centraliza-se dentro de um container flex em coluna (ex.: cabeçalho de cartão).
export interface LogoProps {
  align?: "center" | "start";
  // "full" mostra o símbolo e a palavra "murel"; "symbol" só o símbolo.
  variant?: "full" | "symbol";
  // Altura do símbolo em pixels (mínimo da marca: 24px com palavra, 16px sozinho).
  size?: number;
  // "onYellow" é para fundo amarelo: tudo em asfalto.
  tone?: MurelSymbolTone;
  // Carro estaciona ao aparecer: só para logotipos grandes (login e adesão).
  animated?: boolean;
  // Abaixo do breakpoint `sm`, esconde a palavra e deixa só o símbolo.
  compactOnMobile?: boolean;
}

export function Logo({ align = "center", variant = "full", size = 48, tone = "default", animated = false, compactOnMobile = false }: LogoProps) {
  const height = Math.max(size, variant === "full" ? 24 : 16);

  return (
    <LogoWrapper role="img" aria-label="Murel" $align={align} $tone={tone} $size={height} $compact={compactOnMobile && variant === "full"}>
      <MurelSymbol size={height} tone={tone} animated={animated} />
      {variant === "full" && (
        <Word $tone={tone} $size={height} aria-hidden="true">
          murel
        </Word>
      )}
    </LogoWrapper>
  );
}
