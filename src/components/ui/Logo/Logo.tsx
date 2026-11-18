"use client";

import { type Ref, useImperativeHandle, useRef } from "react";
import { LogoWrapper, Word } from "./Logo.styles";
import { MurelSymbol, type MurelSymbolTone } from "./MurelSymbol";
import { useAnimacaoDoCarro } from "./useAnimacaoDoCarro";

export interface LogoHandle {
  // Para a animação e põe o carro na vaga. Devolve true se estava animando (quem é link usa isso para não navegar).
  parar: () => boolean;
}

// Centraliza-se dentro de um container flex em coluna (ex.: cabeçalho de cartão).
export interface LogoProps {
  align?: "center" | "start";
  // "full" mostra o símbolo e a palavra "murel"; "symbol" só o símbolo.
  variant?: "full" | "symbol";
  // Altura do símbolo em pixels (mínimo da marca: 24px com palavra, 16px sozinho).
  size?: number;
  // "onYellow" é para fundo amarelo: tudo em asfalto (e nunca anima).
  tone?: MurelSymbolTone;
  // O carro sai da vaga, vai embora e volta, duas vezes, e termina estacionado. Usado no cabeçalho, no login,
  // na adesão e nas páginas públicas; nunca no cartaz nem na impressão. Sem animação com movimento reduzido.
  animated?: boolean;
  // Abaixo do breakpoint `sm`, esconde a palavra e deixa só o símbolo.
  compactOnMobile?: boolean;
  // Com animação, passar o mouse ou tocar no logo a para. Desligue quando o logo está dentro de um link que
  // controla a parada pelo `ref` (o Header).
  pararAoInteragir?: boolean;
  ref?: Ref<LogoHandle>;
}

export function Logo({
  align = "center",
  variant = "full",
  size = 48,
  tone = "default",
  animated = false,
  compactOnMobile = false,
  pararAoInteragir = true,
  ref,
}: LogoProps) {
  const height = Math.max(size, variant === "full" ? 24 : 16);
  const animado = animated && tone !== "onYellow";
  const areaRef = useRef<HTMLDivElement>(null);
  const { refs, parar } = useAnimacaoDoCarro({ ativo: animado, area: areaRef, alturaSimbolo: height });

  useImperativeHandle(ref, () => ({ parar }), [parar]);

  const interacao =
    animado && pararAoInteragir
      ? {
          onPointerEnter: (evento: React.PointerEvent) => {
            if (evento.pointerType === "mouse") parar();
          },
          onPointerDown: () => {
            parar();
          },
        }
      : {};

  return (
    <LogoWrapper
      ref={areaRef}
      role="img"
      aria-label="Murel"
      $align={align}
      $tone={tone}
      $size={height}
      $compact={compactOnMobile && variant === "full"}
      $animado={animado}
      {...interacao}
    >
      <MurelSymbol size={height} tone={tone} carro={animado ? refs : undefined} />
      {variant === "full" && (
        <Word $tone={tone} $size={height} aria-hidden="true">
          murel
        </Word>
      )}
    </LogoWrapper>
  );
}
