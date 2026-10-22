"use client";

import { formatDateTime } from "@/components/caixa/format";
import { ListError } from "@/components/mensalistas/ListError";
import { EmptyState, Primary, SkeletonRows } from "@/components/mensalistas/Mensalistas.styles";
import { Skeleton } from "@/components/ui/Skeleton";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/Table";
import { Text } from "@/components/ui/Text";
import { formatDocumentoAuto } from "@/lib/documento";
import { formatBRL } from "@/lib/money";
import { formatPlacaExibicao } from "@/lib/placa";
import type { NotaFiscal } from "@/types/notaFiscal";
import { colunasVisiveis, ordenarNotas, resumirNotas, textoResumo, type TipoLista } from "../notas";
import { Conteudo, Dica, NotaRow, NotasTabela, Resumo } from "../Notas.styles";

const SKELETON_ROWS = 6;
const SEM_DADO = "—";

export interface NotasListProps {
  tipo: TipoLista;
  // Parte do resultado de `useQuery` de que a lista precisa.
  data: NotaFiscal[] | undefined;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
  isFetching: boolean;
  onRetry: () => void;
}

export function NotasList({ tipo, data, isPending, isError, error, isFetching, onRetry }: NotasListProps) {
  const rotuloLista = tipo === "pendentes" ? "as notas pendentes" : "as notas lançadas";

  if (isError && error) {
    return <ListError error={error} what={rotuloLista} onRetry={onRetry} retrying={isFetching} />;
  }

  if (isPending || !data) {
    return (
      <NotasTabela $refreshing={false} role="status" aria-label="Carregando notas">
        <SkeletonRows>
          {Array.from({ length: SKELETON_ROWS }, (_, index) => (
            <Skeleton key={index} height="20px" />
          ))}
        </SkeletonRows>
      </NotasTabela>
    );
  }

  if (data.length === 0) {
    return (
      <EmptyState>
        <Text variant="muted">{tipo === "pendentes" ? "Nenhuma nota pendente." : "Nenhuma nota lançada neste período."}</Text>
        {tipo === "lancadas" && <Dica>Tente ampliar o período.</Dica>}
      </EmptyState>
    );
  }

  const notas = ordenarNotas(data, tipo);
  const resumo = resumirNotas(notas);
  const colunas = colunasVisiveis(notas, tipo);

  return (
    <Conteudo>
      <Resumo role="status">
        <span>{textoResumo(resumo, tipo)}</span>
        {colunas.valor && (
          <>
            <span aria-hidden="true">·</span>
            <strong>{formatBRL(resumo.total)}</strong>
          </>
        )}
      </Resumo>
      <NotasTabela $refreshing={isFetching}>
        <Table aria-label={tipo === "pendentes" ? "Notas fiscais pendentes" : "Notas fiscais lançadas"}>
          <TableHead>
            <TableRow>
              <TableCell head>Solicitada em</TableCell>
              {colunas.cliente && <TableCell head>Cliente</TableCell>}
              {colunas.placa && <TableCell head>Saída</TableCell>}
              {colunas.lancamento && <TableCell head>Lançada em</TableCell>}
              {colunas.valor && (
                <TableCell head align="right">
                  Valor
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {notas.map((nota, indice) => (
              <NotaRow key={nota.notaFiscalId ?? `sem-id-${indice}`}>
                <TableCell data-label="Solicitada em" numeric>
                  {nota.dataSolicitacao ? formatDateTime(nota.dataSolicitacao) : SEM_DADO}
                </TableCell>
                {colunas.cliente && (
                  <TableCell data-label="Cliente">
                    <Primary>{nota.email ?? SEM_DADO}</Primary>
                    {nota.documento && <div>{formatDocumentoAuto(nota.documento)}</div>}
                  </TableCell>
                )}
                {colunas.placa && <TableCell data-label="Saída">{nota.placa ? formatPlacaExibicao(nota.placa) : SEM_DADO}</TableCell>}
                {colunas.lancamento && (
                  <TableCell data-label="Lançada em" numeric>
                    {nota.dataLancamento ? formatDateTime(nota.dataLancamento) : SEM_DADO}
                  </TableCell>
                )}
                {colunas.valor && (
                  <TableCell data-label="Valor" align="right" numeric>
                    {nota.valor !== null ? formatBRL(nota.valor) : SEM_DADO}
                  </TableCell>
                )}
              </NotaRow>
            ))}
          </TableBody>
        </Table>
      </NotasTabela>
    </Conteudo>
  );
}
