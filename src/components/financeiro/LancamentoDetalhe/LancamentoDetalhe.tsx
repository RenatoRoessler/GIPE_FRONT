"use client";

import { useMemo } from "react";
import { formaPagamentoLabel } from "@/components/caixa/format";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TIPO_LANCAMENTO, type Lancamento } from "@/types/financeiro";
import { tipoDoLancamento, tipoPorCategoria } from "../categorias";
import { ValorLancamento } from "../Financeiro.styles";
import { formatDataBr, formatValorComSinal, nomeDaCategoria, rotuloTipo } from "../format";
import { useCategorias } from "../useCategorias";
import { useLancamento } from "../useLancamento";
import { Lista, Selos } from "./LancamentoDetalhe.styles";

export interface LancamentoDetalheProps {
  id: number;
  onClose: () => void;
  onEditar: (lancamento: Lancamento) => void;
  onCancelar: (lancamento: Lancamento) => void;
}

const SEM_VALOR = "—";

export function LancamentoDetalhe({ id, onClose, onEditar, onCancelar }: LancamentoDetalheProps) {
  const { data: lancamento, isPending, isError, error, refetch, isFetching } = useLancamento(id);
  const categoriasQuery = useCategorias();
  const tipos = useMemo(() => tipoPorCategoria(categoriasQuery.data ?? []), [categoriasQuery.data]);

  const tipo = lancamento ? tipoDoLancamento(lancamento, tipos) : null;

  return (
    <Modal
      open
      title={lancamento?.descricao || "Lançamento"}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Fechar
          </Button>
          {lancamento && !lancamento.cancelado && (
            <>
              <Button type="button" variant="secondary" onClick={() => onEditar(lancamento)}>
                Editar
              </Button>
              <Button type="button" variant="danger" onClick={() => onCancelar(lancamento)}>
                Cancelar lançamento
              </Button>
            </>
          )}
        </>
      }
    >
      {isPending && (
        <div role="status" aria-label="Carregando lançamento">
          <Skeleton height="20px" />
        </div>
      )}
      {isError && (
        <>
          <ErrorBanner role="alert">Não foi possível carregar o lançamento. {error.message}</ErrorBanner>
          <Button type="button" variant="secondary" onClick={() => void refetch()} disabled={isFetching}>
            Tentar novamente
          </Button>
        </>
      )}
      {lancamento && (
        <>
          {(lancamento.peloCaixa || lancamento.cancelado) && (
            <Selos>
              {lancamento.peloCaixa && <StatusBadge tone="info">Lançado pelo caixa</StatusBadge>}
              {lancamento.cancelado && <StatusBadge tone="neutral">Cancelado</StatusBadge>}
            </Selos>
          )}
          <Lista>
            <dt>Tipo</dt>
            <dd>{tipo ? rotuloTipo(tipo) : SEM_VALOR}</dd>
            <dt>Categoria</dt>
            <dd>{nomeDaCategoria(lancamento.categoria, lancamento.categoriaPai) || SEM_VALOR}</dd>
            <dt>Valor</dt>
            <dd>
              <ValorLancamento
                $sentido={tipo === TIPO_LANCAMENTO.Entrada ? "entrada" : tipo === TIPO_LANCAMENTO.Saida ? "saida" : "neutro"}
                $cancelado={lancamento.cancelado}
              >
                {formatValorComSinal(lancamento.valor, tipo)}
              </ValorLancamento>
            </dd>
            <dt>Data do pagamento</dt>
            <dd>{formatDataBr(lancamento.dataPagamento)}</dd>
            <dt>Forma de pagamento</dt>
            <dd>{formaPagamentoLabel(lancamento.formaPagamento)}</dd>
            <dt>{tipo === TIPO_LANCAMENTO.Entrada ? "Recebido de" : "Pago a"}</dt>
            <dd>{lancamento.favorecido ?? SEM_VALOR}</dd>
            <dt>Documento</dt>
            <dd>{lancamento.documento ?? SEM_VALOR}</dd>
            <dt>Observação</dt>
            <dd>{lancamento.observacao ?? SEM_VALOR}</dd>
            {lancamento.cancelado && (
              <>
                <dt>Cancelado por</dt>
                <dd>{lancamento.canceladoPor ?? SEM_VALOR}</dd>
              </>
            )}
          </Lista>
        </>
      )}
    </Modal>
  );
}
