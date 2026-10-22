"use client";

import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/Table";
import { Text } from "@/components/ui/Text";
import type { MensalistaTipo } from "@/types/mensalista";
import { EditIcon } from "../EditIcon";
import { formatCategoria, formatDias, formatHorario, formatValor } from "../format";
import { ListError } from "../ListError";
import { EmptyState, IconButton, Primary, RowActions, SkeletonRows, TableArea, Toolbar } from "../Mensalistas.styles";
import { useTiposMensalidade } from "../useTiposMensalidade";

const SKELETON_ROWS = 6;

export interface TiposListProps {
  onNovo: () => void;
  onEditar: (tipo: MensalistaTipo) => void;
}

export function TiposList({ onNovo, onEditar }: TiposListProps) {
  const { data, isPending, isError, error, refetch, isFetching } = useTiposMensalidade();

  if (isError) {
    return <ListError error={error} what="os tipos de mensalidade" onRetry={() => void refetch()} retrying={isFetching} />;
  }

  if (isPending) {
    return (
      <TableArea $refreshing={false} role="status" aria-label="Carregando tipos de mensalidade">
        <SkeletonRows>
          {Array.from({ length: SKELETON_ROWS }, (_, index) => (
            <Skeleton key={index} height="20px" />
          ))}
        </SkeletonRows>
      </TableArea>
    );
  }

  if (data.length === 0) {
    return (
      <EmptyState>
        <Text variant="muted">Nenhum tipo de mensalidade cadastrado.</Text>
        <Text variant="muted">É preciso ter pelo menos um tipo ativo para cadastrar mensalistas.</Text>
        <Button type="button" onClick={onNovo}>
          Novo tipo
        </Button>
      </EmptyState>
    );
  }

  return (
    <>
      <Toolbar>
        <span />
        <Button type="button" onClick={onNovo}>
          Novo tipo
        </Button>
      </Toolbar>
      <TableArea $refreshing={isFetching}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell head>Nome</TableCell>
              <TableCell head>Categoria</TableCell>
              <TableCell head align="right">
                Mensalidade
              </TableCell>
              <TableCell head>Dias</TableCell>
              <TableCell head>Horário</TableCell>
              <TableCell head>Situação</TableCell>
              <TableCell head align="right">
                Ações
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((tipo) => (
              <TableRow key={tipo.mensalistaTipoId}>
                <TableCell data-label="Nome">
                  <Primary>{tipo.tipoMensal}</Primary>
                </TableCell>
                <TableCell data-label="Categoria">{formatCategoria(tipo.categoria)}</TableCell>
                <TableCell data-label="Mensalidade" align="right" numeric>
                  {formatValor(tipo.valorMensalidade)}
                </TableCell>
                <TableCell data-label="Dias">{formatDias(tipo)}</TableCell>
                <TableCell data-label="Horário" numeric>
                  {formatHorario(tipo.horarioEntrada, tipo.horarioSaida)}
                </TableCell>
                <TableCell data-label="Situação">
                  <StatusBadge tone={tipo.ativo ? "success" : "neutral"}>{tipo.ativo ? "Ativo" : "Inativo"}</StatusBadge>
                </TableCell>
                <TableCell data-label="Ações" align="right">
                  <RowActions>
                    <IconButton
                      type="button"
                      aria-label={`Editar ${tipo.tipoMensal}`}
                      title="Editar"
                      onClick={() => onEditar(tipo)}
                    >
                      <EditIcon />
                    </IconButton>
                  </RowActions>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableArea>
    </>
  );
}
