"use client";

import type { KeyboardEvent, Ref } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getSituacao } from "@/lib/api/services/preco.mapper";
import type { PrecoView } from "@/types/preco";
import { formatBRL, formatMinutos, getTipoRegraLabel } from "../format";
import { COR_DO_TIPO, Tipo } from "../PrecoListItem/PrecoListItem.styles";
import type { DirecaoFoco } from "../PrecoListItem";
import { SITUACAO_BADGE } from "../situacao";
import { Degrau, Degraus, MetaMini, Nome, Placa, SemValores } from "./EsteiraPlacas.styles";

// Com diária cabem o primeiro degrau e a diária; sem diária, os dois primeiros degraus.
const DEGRAUS_COM_DIARIA = 1;
const DEGRAUS_SEM_DIARIA = 2;

const TECLAS: Record<string, DirecaoFoco> = {
  ArrowLeft: "anterior",
  ArrowRight: "proximo",
  Home: "inicio",
  End: "fim",
};

export interface PlacaMiniProps {
  preco: PrecoView;
  selecionada: boolean;
  onSelecionar: (id: number) => void;
  // Quem renderiza a esteira coordena o foco entre as placas (roving tabindex).
  tabIndex?: number;
  onMoverFoco?: (direcao: DirecaoFoco) => void;
  agora?: Date;
  ref?: Ref<HTMLButtonElement>;
}

// Miniplaca da esteira: o nome, o tipo, a situação e os primeiros degraus com a diária.
export function PlacaMini({ preco, selecionada, onSelecionar, tabIndex, onMoverFoco, agora, ref }: Readonly<PlacaMiniProps>) {
  const situacao = SITUACAO_BADGE[getSituacao(preco.ativo, preco.inicioVigencia, preco.fimVigencia, agora ?? new Date())];
  const temDiaria = preco.valorDiaria > 0;
  const faixas = [...preco.faixas]
    .sort((a, b) => a.minutosLimite - b.minutosLimite)
    .slice(0, temDiaria ? DEGRAUS_COM_DIARIA : DEGRAUS_SEM_DIARIA);

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const direcao = TECLAS[event.key];
    if (direcao && onMoverFoco) {
      event.preventDefault();
      onMoverFoco(direcao);
    }
  }

  return (
    <Placa
      ref={ref}
      type="button"
      $selecionada={selecionada}
      aria-current={selecionada ? "true" : undefined}
      tabIndex={tabIndex}
      onClick={() => onSelecionar(preco.rotatividadeId)}
      onKeyDown={handleKeyDown}
    >
      <Nome title={preco.descricao}>{preco.descricao}</Nome>
      <MetaMini>
        <Tipo $cor={preco.tipoRegra ? COR_DO_TIPO[preco.tipoRegra] : "steel"}>{getTipoRegraLabel(preco.tipoRegra)}</Tipo>
        <StatusBadge tone={situacao.tone}>{situacao.label}</StatusBadge>
      </MetaMini>
      {faixas.length === 0 && !temDiaria ? (
        <SemValores>Sem valores</SemValores>
      ) : (
        <Degraus>
          {faixas.map((faixa) => (
            <Degrau key={faixa.minutosLimite}>
              <strong>{formatBRL(faixa.valor)}</strong>
              {formatMinutos(faixa.minutosLimite)}
            </Degrau>
          ))}
          {temDiaria && (
            <Degrau $diaria>
              <strong>{formatBRL(preco.valorDiaria)}</strong>
              diária
            </Degrau>
          )}
        </Degraus>
      )}
    </Placa>
  );
}
