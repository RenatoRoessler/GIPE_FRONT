"use client";

import type { ReactNode } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Servico } from "@/types/servico";
import { formatDuracao, formatTempoPermitido } from "../format";
import { PrecosPorCategoria } from "../PrecosPorCategoria";
import { Acoes, Aviso, Cabecalho, Descricao, Dado, Dados, Rotulo, Secao, SecaoTitulo, Titulo, Valor } from "./ServicoDetalhe.styles";

export interface ServicoDetalheProps {
  servico: Servico;
  // Botões do cabeçalho (editar, inativar), que só quem mantém o catálogo recebe.
  acoes?: ReactNode;
}

export function ServicoDetalhe({ servico, acoes }: ServicoDetalheProps) {
  return (
    <article aria-labelledby={`servico-${servico.id}-titulo`}>
      <Cabecalho>
        <div>
          <Titulo id={`servico-${servico.id}-titulo`}>{servico.nome}</Titulo>
          <StatusBadge tone={servico.ativo ? "success" : "neutral"}>{servico.ativo ? "Ativo" : "Inativo"}</StatusBadge>
        </div>
        {acoes && <Acoes>{acoes}</Acoes>}
      </Cabecalho>

      {!servico.ativo && <Aviso role="note">Serviço inativo: não pode ser acrescentado a veículos. Os que já o têm continuam com ele.</Aviso>}

      {servico.descricao && <Descricao>{servico.descricao}</Descricao>}

      <Secao>
        <SecaoTitulo>Tempos</SecaoTitulo>
        <Dados>
          <Dado>
            <Rotulo>Duração estimada</Rotulo>
            <Valor>{formatDuracao(servico.duracaoMinutos)}</Valor>
          </Dado>
          <Dado>
            <Rotulo>Tempo permitido</Rotulo>
            <Valor>{formatTempoPermitido(servico.tempoPermitidoMinutos)}</Valor>
          </Dado>
        </Dados>
      </Secao>

      <Secao>
        <SecaoTitulo>Preços por categoria</SecaoTitulo>
        <PrecosPorCategoria servico={servico} />
      </Secao>
    </article>
  );
}
