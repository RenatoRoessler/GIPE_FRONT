"use client";

import { Tabs } from "@/components/ui/Tabs";
import { saudacaoCompleta } from "../apresentacao";
import { dataPorExtenso, horaCurta } from "../format";
import { TIPOS_PERIODO, type TipoPeriodo } from "../periodo";
import { Controles, Navegacao, Raiz, Rotulo, Saudacao, Seletor, Seta, Subtitulo, Titulo, VoltarParaHoje } from "./CabecalhoDashboard.styles";

const NOMES: Record<TipoPeriodo, string> = { dia: "Dia", semana: "Semana", mes: "Mês" };
const ABAS = TIPOS_PERIODO.map((tipo) => ({ id: tipo, label: NOMES[tipo] }));

export interface CabecalhoDashboardProps {
  nome: string | null | undefined;
  // O instante de agora: decide a saudação e a data por extenso.
  agora: Date;
  // Quando os dados foram calculados (`dataReferencia` da API). Nulo antes da primeira resposta.
  atualizadoEm: Date | null;
  tipo: TipoPeriodo;
  // O período escolhido, já escrito: "Hoje · 19 nov", "Esta semana · 16 – 22 nov", "Outubro 2026".
  rotulo: string;
  podeVoltar: boolean;
  podeAvancar: boolean;
  mostrarVoltarParaHoje: boolean;
  onTipoChange: (tipo: TipoPeriodo) => void;
  onAnterior: () => void;
  onProximo: () => void;
  onVoltarParaHoje: () => void;
}

function Chevron({ para }: { para: "esquerda" | "direita" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={para === "esquerda" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
    </svg>
  );
}

// Saudação, seletor de período (Dia / Semana / Mês) e navegação ‹ rótulo ›. Só desenha: quem decide o período é a página.
export function CabecalhoDashboard({
  nome,
  agora,
  atualizadoEm,
  tipo,
  rotulo,
  podeVoltar,
  podeAvancar,
  mostrarVoltarParaHoje,
  onTipoChange,
  onAnterior,
  onProximo,
  onVoltarParaHoje,
}: CabecalhoDashboardProps) {
  const subtitulo = atualizadoEm ? `${dataPorExtenso(agora)} · atualizado às ${horaCurta(atualizadoEm)}` : dataPorExtenso(agora);

  return (
    <Raiz>
      <Saudacao>
        <Titulo>{saudacaoCompleta(agora.getHours(), nome)}</Titulo>
        <Subtitulo>{subtitulo}</Subtitulo>
      </Saudacao>
      <Controles>
        <Seletor>
          <Tabs aria-label="Período" variant="segmentada" tabs={ABAS} value={tipo} onChange={(id) => onTipoChange(id as TipoPeriodo)} />
        </Seletor>
        <Navegacao>
          <Seta type="button" aria-label="Período anterior" disabled={!podeVoltar} onClick={onAnterior}>
            <Chevron para="esquerda" />
          </Seta>
          <Rotulo aria-live="polite" aria-atomic="true">
            {rotulo}
          </Rotulo>
          <Seta type="button" aria-label="Próximo período" disabled={!podeAvancar} onClick={onProximo}>
            <Chevron para="direita" />
          </Seta>
        </Navegacao>
        {mostrarVoltarParaHoje && (
          <VoltarParaHoje type="button" onClick={onVoltarParaHoje}>
            Voltar para hoje
          </VoltarParaHoje>
        )}
      </Controles>
    </Raiz>
  );
}
