"use client";

import { useId } from "react";
import styled, { css, keyframes } from "styled-components";

// Proporção do símbolo no guia de marca (viewBox 240×160).
const ASPECT = 240 / 160;

// O carro é sempre amarelo (regra da marca), exceto sobre fundo amarelo, onde tudo vira asfalto.
const AMARELO_FAIXA = "#FFC20E";
const ASFALTO = "#0E1729";

export type MurelSymbolTone = "default" | "onYellow";

export interface MurelSymbolProps {
  // Altura em pixels. O mínimo da marca para o símbolo sozinho é 16px.
  size?: number;
  tone?: MurelSymbolTone;
  // Faz o carro estacionar na vaga do meio ao aparecer (só onde o símbolo é grande).
  animated?: boolean;
  // Sem rótulo o símbolo é decorativo (o contêiner, como o Logo, já nomeia a marca).
  label?: string;
}

const estaciona = keyframes`
  from {
    transform: translateY(46px);
  }

  to {
    transform: none;
  }
`;

const Car = styled.g<{ $animated: boolean }>`
  ${({ $animated }) =>
    $animated &&
    css`
      @media (prefers-reduced-motion: no-preference) {
        animation: ${estaciona} 1.1s cubic-bezier(0.2, 0.8, 0.2, 1) both 0.2s;
      }
    `}
`;

// Três vagas formam o M; o carro estacionado na vaga do meio é a assinatura da marca.
export function MurelSymbol({ size = 32, tone = "default", animated = false, label }: MurelSymbolProps) {
  const maskId = useId();
  const height = Math.max(size, 16);
  const onYellow = tone === "onYellow";

  return (
    <svg
      viewBox="0 0 240 160"
      width={height * ASPECT}
      height={height}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      overflow="visible"
      style={{ flex: "0 0 auto" }}
    >
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="240" height="160">
          <rect width="240" height="160" fill="#fff" />
          <path d="M108 87H132L129.5 76Q120 72.5 110.5 76Z" fill="#000" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
          <path d="M110 112H130L128 119Q120 121 112 119Z" fill="#000" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
        </mask>
      </defs>
      <path
        d="M20 140V24H220V140M82 24V140M158 24V140"
        fill="none"
        stroke={onYellow ? ASFALTO : "currentColor"}
        strokeWidth="18"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Car $animated={animated}>
        <rect x="102" y="62" width="36" height="66" rx="12" fill={onYellow ? ASFALTO : AMARELO_FAIXA} mask={`url(#${maskId})`} />
      </Car>
    </svg>
  );
}
