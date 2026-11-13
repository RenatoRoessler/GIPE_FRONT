"use client";

import { useId } from "react";
import type { Servico } from "@/types/servico";
import { formatCentavosOuGratis, formatDuracaoNatural } from "../format";
import { Caixa, Detalhe, Entrada, Linha, Nome, Preco, Texto } from "./ServicoOpcao.styles";

export interface ServicoOpcaoProps {
  servico: Servico;
  // Preço na categoria do veículo; nulo: o serviço não atende a categoria.
  precoCentavos: number | null;
  marcado: boolean;
  desabilitado?: boolean;
  onAlternar: (id: number, marcado: boolean) => void;
}

// Uma linha da folha de adicionar serviços: a linha toda é o alvo de toque (≥ 44px) e alterna a seleção.
export function ServicoOpcao({ servico, precoCentavos, marcado, desabilitado = false, onAlternar }: ServicoOpcaoProps) {
  const detalheId = useId();
  const atende = precoCentavos !== null;
  const detalhe = atende
    ? [servico.descricao, formatDuracaoNatural(servico.duracaoMinutos)].filter(Boolean).join(" · ")
    : "Não atende esta categoria";

  return (
    <Linha $marcado={marcado} $desabilitado={desabilitado || !atende}>
      <Entrada
        type="checkbox"
        checked={marcado}
        disabled={desabilitado || !atende}
        aria-describedby={detalhe ? detalheId : undefined}
        onChange={(event) => onAlternar(servico.id, event.target.checked)}
      />
      <Caixa $marcado={marcado} aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2.5 7.5L5.5 10.5L11.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Caixa>
      <Texto>
        <Nome>{servico.nome}</Nome>
        {detalhe && <Detalhe id={detalheId}>{detalhe}</Detalhe>}
      </Texto>
      <Preco $apagado={!atende}>{atende ? formatCentavosOuGratis(precoCentavos) : "—"}</Preco>
    </Linha>
  );
}
