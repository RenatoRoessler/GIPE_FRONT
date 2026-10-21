"use client";

import { formatBRL } from "@/lib/money";
import type { AgendaResumoData } from "@/types/mensalista";
import { formatDiaMes } from "../agenda";
import { Resumo, ResumoCurto, ResumoLongo } from "./AgendaView.styles";

export interface AgendaResumoProps {
  resumo: AgendaResumoData;
  // A lista carregada foi cortada: o total vale só para o que foi carregado.
  truncado?: boolean;
}

// Uma frase, e não um cartão com número grande: o que importa é saber quanto vem até domingo.
export function AgendaResumo({ resumo, truncado = false }: AgendaResumoProps) {
  const { quantidade, total, ate } = resumo;
  const ateTexto = formatDiaMes(ate);
  const carga = truncado ? " (nesta carga)" : "";

  return (
    <Resumo role="status">
      {quantidade === 0 ? (
        <>Nenhum mensalista vence até domingo, {ateTexto}.</>
      ) : (
        <>
          <ResumoLongo>
            Até domingo, {ateTexto}: <strong>{quantidade === 1 ? "1 mensalista vence" : `${quantidade} mensalistas vencem`}</strong>,
            somando <strong>{formatBRL(total)}</strong>
            {carga}.
          </ResumoLongo>
          <ResumoCurto>
            Até domingo: <strong>{quantidade === 1 ? "1 vence" : `${quantidade} vencem`}</strong>, <strong>{formatBRL(total)}</strong>
            {carga}
          </ResumoCurto>
        </>
      )}
    </Resumo>
  );
}
