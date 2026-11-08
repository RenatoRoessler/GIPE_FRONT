"use client";

import NextLink from "next/link";
import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import { formatDataBr } from "@/components/financeiro/format";
import { ErroSemPermissao } from "@/components/layout/ErroSemPermissao";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Pagination } from "@/components/ui/Pagination";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/Table";
import { Text } from "@/components/ui/Text";
import { isForbiddenError } from "@/lib/api/errors";
import { formatBRL } from "@/lib/money";
import type { FaturaFiltros } from "@/types/fatura";
import { EmptyState, ErrorArea, NumeroLink, Primary, SkeletonRows, TableArea, Valor } from "../Faturas.styles";
import { numeroFatura } from "../format";
import { rotuloSituacao, tomSituacao } from "../situacao";
import { faturaUrl } from "../url";
import { useFaturas } from "../useFaturas";

const SKELETON_ROWS = 6;

export interface FaturasListaProps {
  filtros: FaturaFiltros;
  onPaginaChange: (pagina: number) => void;
  onEmitir: () => void;
  onLimparFiltros: () => void;
}

export function FaturasLista({ filtros, onPaginaChange, onEmitir, onLimparFiltros }: FaturasListaProps) {
  const router = useRouter();
  const { data, isPending, isError, error, refetch, isFetching, isPlaceholderData } = useFaturas(filtros);
  const comFiltro = filtros.empresaConveniadaId !== null || filtros.situacao !== null;

  // O clique na linha leva ao detalhe; o clique no próprio link já navega e não pode navegar duas vezes.
  function abrir(evento: MouseEvent<HTMLTableRowElement>, id: number) {
    if ((evento.target as HTMLElement).closest("a")) {
      return;
    }
    router.push(faturaUrl(id));
  }

  if (isError) {
    // 403 não melhora ao tentar de novo: mostra só o aviso de permissão.
    if (isForbiddenError(error)) {
      return <ErroSemPermissao />;
    }
    return (
      <ErrorArea>
        <ErrorBanner role="alert">Não foi possível carregar as faturas. {error.message}</ErrorBanner>
        <Button type="button" variant="secondary" onClick={() => void refetch()} disabled={isFetching}>
          Tentar novamente
        </Button>
      </ErrorArea>
    );
  }

  if (isPending) {
    return (
      <TableArea $refreshing={false} role="status" aria-label="Carregando faturas">
        <SkeletonRows>
          {Array.from({ length: SKELETON_ROWS }, (_, index) => (
            <Skeleton key={index} height="20px" />
          ))}
        </SkeletonRows>
      </TableArea>
    );
  }

  if (data.items.length === 0) {
    if (comFiltro) {
      return (
        <EmptyState>
          <Text variant="muted">Nenhuma fatura encontrada com esses filtros.</Text>
          <Button type="button" variant="secondary" onClick={onLimparFiltros}>
            Limpar filtros
          </Button>
        </EmptyState>
      );
    }
    return (
      <EmptyState>
        <Text variant="muted">Nenhuma fatura emitida ainda.</Text>
        <Button type="button" onClick={onEmitir}>
          Emitir fatura
        </Button>
      </EmptyState>
    );
  }

  return (
    <>
      <TableArea $refreshing={isPlaceholderData} aria-busy={isPlaceholderData}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell head>Fatura</TableCell>
              <TableCell head>Conveniada</TableCell>
              <TableCell head>Emitida em</TableCell>
              <TableCell head>Vencimento</TableCell>
              <TableCell head align="right">
                Saídas
              </TableCell>
              <TableCell head align="right">
                Valor
              </TableCell>
              <TableCell head>Situação</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.items.map((fatura) => (
              <TableRow key={fatura.convenioFaturaId} clickable onClick={(evento) => abrir(evento, fatura.convenioFaturaId)}>
                <TableCell data-label="Fatura">
                  <NumeroLink as={NextLink} href={faturaUrl(fatura.convenioFaturaId)} aria-label={`Fatura ${numeroFatura(fatura)}`}>
                    {numeroFatura(fatura)}
                  </NumeroLink>
                </TableCell>
                <TableCell data-label="Conveniada">
                  <Primary>{fatura.conveniada}</Primary>
                </TableCell>
                <TableCell data-label="Emitida em" numeric>
                  {formatDataBr(fatura.dataCriacao.slice(0, 10))}
                </TableCell>
                <TableCell data-label="Vencimento" numeric>
                  {formatDataBr(fatura.vencimento)}
                </TableCell>
                <TableCell data-label="Saídas" align="right" numeric>
                  {fatura.quantidadeSaidas}
                </TableCell>
                <TableCell data-label="Valor" align="right" numeric>
                  <Valor>{formatBRL(fatura.valorTotal)}</Valor>
                </TableCell>
                <TableCell data-label="Situação">
                  <StatusBadge tone={tomSituacao(fatura.situacao)}>{rotuloSituacao(fatura.situacao)}</StatusBadge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableArea>
      <Pagination
        page={data.page}
        totalPages={data.totalPages}
        totalRecords={data.totalRecords}
        pageSize={data.pageSize}
        onPageChange={onPaginaChange}
      />
    </>
  );
}
