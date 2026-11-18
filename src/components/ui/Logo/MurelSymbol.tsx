"use client";

import { type RefObject, useId } from "react";

// Proporção do símbolo no guia de marca (viewBox 240×160).
const ASPECT = 240 / 160;

// O carro é sempre amarelo (regra da marca), exceto sobre fundo amarelo, onde tudo vira asfalto.
const AMARELO_FAIXA = "#FFC20E";
const ASFALTO = "#0E1729";
// Luzes do carro no logo animado: da marca, iguais nos dois temas (a luz de freio não é um estado de erro).
const LUZ_FAROL = "#FFF6CC";
const LUZ_FAROL_PONTO = "#FFF8DA";
const LUZ_FREIO = "#FF3B3B";
const LUZ_FREIO_PONTO = "#FF5A5A";
const LUZ_RE = "#FFFFFF";
// Abaixo desta altura os pontos de luz teriam menos de 1px: ficam só o facho e os halos.
const ALTURA_LUZES_DETALHADAS = 40;

// Elementos que a animação move e acende (ver useAnimacaoDoCarro).
export interface CarroRefs {
  carro: RefObject<SVGGElement | null>;
  freio: RefObject<SVGGElement | null>;
  re: RefObject<SVGGElement | null>;
  facho: RefObject<SVGPathElement | null>;
}

export type MurelSymbolTone = "default" | "onYellow";

export interface MurelSymbolProps {
  // Altura em pixels. O mínimo da marca para o símbolo sozinho é 16px.
  size?: number;
  tone?: MurelSymbolTone;
  // Sem rótulo o símbolo é decorativo (o contêiner, como o Logo, já nomeia a marca).
  label?: string;
  // Uso interno do Logo animado: liga os refs do carro e desenha as luzes. Sem ele, o símbolo é o estático.
  carro?: CarroRefs;
}

interface LuzesProps {
  refs: CarroRefs;
  detalhadas: boolean;
}

// Faróis com facho, luz de freio e luz de ré, nas coordenadas do carro estacionado (centro em 120, 95).
// Começam apagadas: quem acende é a animação.
function LuzesDoCarro({ refs: { facho, freio, re }, detalhadas }: LuzesProps) {
  const fachoId = useId();
  const brilhoId = useId();
  const desfoque = detalhadas ? 2.2 : 1.1;

  return (
    <g data-luz="" aria-hidden="true">
      <defs>
        <radialGradient id={fachoId} cx="0.5" cy="1" r="1">
          <stop offset="0" stopColor={LUZ_FAROL} stopOpacity="0.55" />
          <stop offset="1" stopColor={LUZ_FAROL} stopOpacity="0" />
        </radialGradient>
        <filter id={brilhoId} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation={desfoque} />
        </filter>
      </defs>
      <path ref={facho} d="M105 62L93 11H147L135 62Z" fill={`url(#${fachoId})`} opacity="0" />
      {detalhadas && (
        <>
          <circle cx="110" cy="65" r="2.4" fill={LUZ_FAROL_PONTO} />
          <circle cx="130" cy="65" r="2.4" fill={LUZ_FAROL_PONTO} />
        </>
      )}
      <g ref={freio} opacity="0">
        <rect x="106" y="122.25" width="8" height="3.5" rx="1.75" fill={LUZ_FREIO} filter={`url(#${brilhoId})`} />
        <rect x="126" y="122.25" width="8" height="3.5" rx="1.75" fill={LUZ_FREIO} filter={`url(#${brilhoId})`} />
        {detalhadas && (
          <>
            <rect x="106" y="122.25" width="8" height="3.5" rx="1.75" fill={LUZ_FREIO_PONTO} />
            <rect x="126" y="122.25" width="8" height="3.5" rx="1.75" fill={LUZ_FREIO_PONTO} />
          </>
        )}
      </g>
      <g ref={re} opacity="0">
        <rect x="115.5" y="123.5" width="9" height="3" rx="1.5" fill={LUZ_RE} filter={`url(#${brilhoId})`} />
        {detalhadas && <rect x="115.5" y="123.5" width="9" height="3" rx="1.5" fill={LUZ_RE} />}
      </g>
    </g>
  );
}

// Três vagas formam o M; o carro estacionado na vaga do meio é a assinatura da marca.
export function MurelSymbol({ size = 32, tone = "default", label, carro }: MurelSymbolProps) {
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
      <g ref={carro?.carro} data-carro={carro ? "" : undefined}>
        <rect x="102" y="62" width="36" height="66" rx="12" fill={onYellow ? ASFALTO : AMARELO_FAIXA} mask={`url(#${maskId})`} />
        {carro && <LuzesDoCarro refs={carro} detalhadas={height >= ALTURA_LUZES_DETALHADAS} />}
      </g>
    </svg>
  );
}
