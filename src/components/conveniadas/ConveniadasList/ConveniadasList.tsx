"use client";

import { ErroSemPermissao } from "@/components/layout/ErroSemPermissao";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/Table";
import { Text } from "@/components/ui/Text";
import { isForbiddenError } from "@/lib/api/errors";
import { formatCNPJ } from "@/lib/cnpj";
import { formatPhone } from "@/lib/phone";
import type { SituacaoFiltro } from "@/types/conveniada";
import { EmptyState, ErrorArea, Primary, SkeletonRows, SubText, TableArea } from "../Conveniadas.styles";
import { enderecoResumido, formatDesde, nomeExibido, razaoSecundaria } from "../format";
import { useConveniadas } from "../useConveniadas";

const SKELETON_ROWS = 6;

const VAZIO_FILTRADO: Record<Exclude<SituacaoFiltro, "todos">, string> = {
  ativos: "Nenhum convênio ativo.",
  encerrados: "Nenhum convênio encerrado.",
};

export interface ConveniadasListProps {
  situacao: SituacaoFiltro;
  onNova: () => void;
  // Volta ao filtro "Todos" quando o filtro atual não tem resultado.
  onVerTodos: () => void;
}

export function ConveniadasList({ situacao, onNova, onVerTodos }: ConveniadasListProps) {
  const { data, isPending, isError, error, refetch, isFetching, isPlaceholderData } = useConveniadas(situacao);

  if (isError) {
    // 403 não melhora ao tentar de novo: mostra só o aviso de permissão.
    if (isForbiddenError(error)) {
      return <ErroSemPermissao />;
    }
    return (
      <ErrorArea>
        <ErrorBanner role="alert">Não foi possível carregar as conveniadas. {error.message}</ErrorBanner>
        <Button type="button" variant="secondary" onClick={() => void refetch()} disabled={isFetching}>
          Tentar novamente
        </Button>
      </ErrorArea>
    );
  }

  if (isPending) {
    return (
      <TableArea $refreshing={false} role="status" aria-label="Carregando conveniadas">
        <SkeletonRows>
          {Array.from({ length: SKELETON_ROWS }, (_, index) => (
            <Skeleton key={index} height="20px" />
          ))}
        </SkeletonRows>
      </TableArea>
    );
  }

  if (data.length === 0) {
    if (situacao !== "todos") {
      return (
        <EmptyState>
          <Text variant="muted">{VAZIO_FILTRADO[situacao]}</Text>
          <Button type="button" variant="secondary" onClick={onVerTodos}>
            Ver todos
          </Button>
        </EmptyState>
      );
    }
    return (
      <EmptyState>
        <Text variant="muted">Nenhuma empresa conveniada ainda.</Text>
        <Button type="button" onClick={onNova}>
          Nova conveniada
        </Button>
      </EmptyState>
    );
  }

  return (
    <TableArea $refreshing={isPlaceholderData} aria-busy={isPlaceholderData}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell head>Empresa</TableCell>
            <TableCell head>CNPJ</TableCell>
            <TableCell head>Contato</TableCell>
            <TableCell head>Situação</TableCell>
            <TableCell head>Desde</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((conveniada) => {
            const razao = razaoSecundaria(conveniada);
            const endereco = enderecoResumido(conveniada.endereco);
            return (
              <TableRow key={conveniada.empresaConvenioId}>
                <TableCell data-label="Empresa">
                  <div>
                    <Primary>{nomeExibido(conveniada)}</Primary>
                    {razao && <SubText>{razao}</SubText>}
                  </div>
                </TableCell>
                <TableCell data-label="CNPJ" numeric>
                  {formatCNPJ(conveniada.cnpj)}
                </TableCell>
                <TableCell data-label="Contato">
                  <div>
                    <span>{formatPhone(conveniada.telefone)}</span>
                    {endereco && <SubText>{endereco}</SubText>}
                  </div>
                </TableCell>
                <TableCell data-label="Situação">
                  <StatusBadge tone={conveniada.ativo ? "success" : "neutral"}>
                    {conveniada.ativo ? "Ativo" : "Encerrado"}
                  </StatusBadge>
                </TableCell>
                <TableCell data-label="Desde" numeric>
                  {formatDesde(conveniada.dataCriacao)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableArea>
  );
}
