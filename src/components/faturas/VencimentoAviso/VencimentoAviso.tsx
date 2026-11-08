"use client";

import { AvisoVenc } from "../FaturasMobile.styles";
import type { AvisoVencimento } from "../vencimento";

export interface VencimentoAvisoProps {
  aviso: AvisoVencimento;
}

const ICONE = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

// O texto diz tudo; o ícone (alerta ou relógio) só reforça, para o aviso nunca depender de cor.
export function VencimentoAviso({ aviso }: VencimentoAvisoProps) {
  const urgente = aviso.tipo === "vencida" || aviso.tipo === "hoje";

  return (
    <AvisoVenc $tipo={aviso.tipo}>
      {urgente && (
        <svg {...ICONE} data-testid="icone-alerta">
          <path d="M12 3 2 20h20L12 3Z" />
          <path d="M12 10v4M12 17.5v.01" />
        </svg>
      )}
      {aviso.tipo === "proxima" && (
        <svg {...ICONE} data-testid="icone-relogio">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      )}
      {aviso.texto}
    </AvisoVenc>
  );
}
