"use client";

import { formatDateTime } from "@/components/caixa/format";
import type { PatioVeiculo } from "@/types/patio";
import { ForaDoQuadro, Gancho, Item, Itens, LinkBotao, Mono, PontoAtencao } from "./TicketView.styles";

const TRACO = "—";

export interface TicketItensProps {
  veiculo: PatioVeiculo;
  // A empresa tem quadro de chaves: só então o item da chave aparece (salvo se o veículo já tem gancho).
  comQuadros: boolean;
  // A empresa usa o prisma: só então ele pode ser informado ou alterado (um valor já gravado aparece sempre).
  prismaAtivo: boolean;
  onGuardarChave: () => void;
  onEditarPrisma: () => void;
}

// Entrada, tabela de preço, quem registrou e onde está a chave. Não há "próxima faixa": o back não entrega esse valor.
export function TicketItens({ veiculo, comQuadros, prismaAtivo, onGuardarChave, onEditarPrisma }: TicketItensProps) {
  const temGancho = Boolean(veiculo.posicaoChave);

  return (
    <Itens aria-label="Detalhes do ticket">
      <Item>
        <dt>Entrada</dt>
        <dd>
          <Mono>{formatDateTime(veiculo.dataHoraEntrada)}</Mono>
        </dd>
      </Item>
      {veiculo.codigoTicket !== null && (
        <Item>
          <dt>Ticket</dt>
          <dd>
            <Mono>{veiculo.codigoTicket}</Mono>
          </dd>
        </Item>
      )}
      <Item>
        <dt>Tabela de preço</dt>
        <dd>{veiculo.rotatividadeDescricao ?? TRACO}</dd>
      </Item>
      <Item>
        <dt>Registrado por</dt>
        <dd>{veiculo.usuarioEntrada ?? TRACO}</dd>
      </Item>
      {(prismaAtivo || veiculo.prisma !== null) && (
        <Item>
          <dt>Prisma</dt>
          <dd>
            {veiculo.prisma !== null ? <Mono>{veiculo.prisma}</Mono> : TRACO}
            {prismaAtivo && (
              <LinkBotao
                type="button"
                aria-label={`${veiculo.prisma !== null ? "Alterar" : "Informar"} prisma de ${veiculo.placa}`}
                onClick={onEditarPrisma}
              >
                {veiculo.prisma !== null ? "Alterar" : "Informar"}
              </LinkBotao>
            )}
          </dd>
        </Item>
      )}
      {(comQuadros || temGancho) && (
        <Item>
          <dt>Quadro de chaves</dt>
          <dd>
            {temGancho ? (
              <Gancho>{veiculo.posicaoChave}</Gancho>
            ) : (
              <ForaDoQuadro>
                <PontoAtencao aria-hidden="true" />
                Fora do quadro
              </ForaDoQuadro>
            )}
            {comQuadros && (
              <LinkBotao type="button" aria-label={`${temGancho ? "Alterar chave de" : "Guardar chave de"} ${veiculo.placa}`} onClick={onGuardarChave}>
                {temGancho ? "Alterar" : "Guardar chave"}
              </LinkBotao>
            )}
          </dd>
        </Item>
      )}
    </Itens>
  );
}
