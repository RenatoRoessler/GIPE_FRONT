"use client";

import { memo } from "react";
import { formatTime } from "@/components/caixa/format";
import { Button } from "@/components/ui/Button";
import { PlateDisplay } from "@/components/ui/PlateDisplay";
import { TipoClienteBadge } from "@/components/ui/TipoClienteBadge";
import { formatPlacaExibicao } from "@/lib/placa";
import { SITUACAO_ITEM, type ItemConferencia, type SituacaoMarcacao } from "@/types/conferenciaPatio";
import { LadoALado } from "../Conferencia.styles";
import { NOME_TIPO_CLIENTE, ORIGEM_ROTULO, rotuloVeiculo, tipoDoCliente } from "../conferencia";
import { Info, Item, Linha, Meta, Nome, Resolvida, Situacao } from "./ConferenciaItem.styles";

export interface ConferenciaItemProps {
  item: ItemConferencia;
  // Enquanto uma marcação está em andamento os botões ficam travados.
  ocupado?: boolean;
  onMarcar: (item: ItemConferencia, situacao: SituacaoMarcacao) => void;
}

function linhaDeApoio(item: ItemConferencia): string {
  const chave = item.chave ? `Chave ${item.chave.posicao}` : "Sem chave";
  return `${chave} · ${NOME_TIPO_CLIENTE[tipoDoCliente(item)]} · desde ${formatTime(item.dataEntrada)}`;
}

function ConferenciaItemBase({ item, ocupado = false, onMarcar }: ConferenciaItemProps) {
  const tipo = tipoDoCliente(item);
  const placa = formatPlacaExibicao(item.placa);

  return (
    <Item data-item-id={item.patioConferenciaItemId}>
      <Linha>
        <PlateDisplay value={item.placa} size="sm" />
        <Info>
          <Nome title={rotuloVeiculo(item)}>{rotuloVeiculo(item)}</Nome>
          <Meta title={linhaDeApoio(item)}>{linhaDeApoio(item)}</Meta>
        </Info>
        <TipoClienteBadge tipo={tipo} />
      </Linha>

      {item.situacao === SITUACAO_ITEM.Pendente && (
        <LadoALado>
          <Button type="button" variant="secondary" size="sm" disabled={ocupado} aria-label={`Está no pátio: ${placa}`} onClick={() => onMarcar(item, SITUACAO_ITEM.Conferido)}>
            Está no pátio
          </Button>
          <Button type="button" variant="secondary" size="sm" disabled={ocupado} aria-label={`Não achei: ${placa}`} onClick={() => onMarcar(item, SITUACAO_ITEM.NaoEncontrado)}>
            Não achei
          </Button>
        </LadoALado>
      )}

      {item.situacao === SITUACAO_ITEM.Conferido && (
        <Resolvida>
          <Situacao $tom="success">
            Conferido {formatTime(item.dataConferido)}
            {item.origem !== null && ORIGEM_ROTULO[item.origem] ? ` · ${ORIGEM_ROTULO[item.origem]}` : ""}
          </Situacao>
          <Button type="button" variant="secondary" size="sm" disabled={ocupado} aria-label={`Desfazer: ${placa}`} onClick={() => onMarcar(item, SITUACAO_ITEM.Pendente)}>
            Desfazer
          </Button>
        </Resolvida>
      )}

      {item.situacao === SITUACAO_ITEM.NaoEncontrado && (
        <Resolvida>
          <Situacao $tom="danger">Não encontrado</Situacao>
          <Button type="button" variant="secondary" size="sm" disabled={ocupado} aria-label={`Procurar de novo: ${placa}`} onClick={() => onMarcar(item, SITUACAO_ITEM.Pendente)}>
            Procurar de novo
          </Button>
        </Resolvida>
      )}

      {item.situacao === SITUACAO_ITEM.Baixado && <Situacao $tom="success">Saída registrada pela conferência</Situacao>}
      {item.situacao === SITUACAO_ITEM.Saiu && <Situacao $tom="success">Saiu do pátio durante a conferência</Situacao>}
    </Item>
  );
}

// A lista pode ter centenas de veículos e muda um por vez: só o item alterado volta a renderizar.
export const ConferenciaItem = memo(ConferenciaItemBase);
