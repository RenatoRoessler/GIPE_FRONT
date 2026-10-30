"use client";

import { useState } from "react";
import { EditIcon } from "@/components/mensalistas/EditIcon";
import { Button } from "@/components/ui/Button";
import { OptionGroup } from "@/components/ui/OptionGroup";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/Table";
import { Text } from "@/components/ui/Text";
import { TIPO_LANCAMENTO, type FinanceiroCategoria, type TipoLancamento } from "@/types/financeiro";
import { montarArvore, separarPorTipo, type NoCategoria, type Situacao } from "../categorias";
import {
  Conteudo,
  EmptyState,
  Filtros,
  IconButton,
  NomeContexto,
  NomeFilha,
  Primary,
  RowActions,
  Secao,
  SecaoTitulo,
  SkeletonRows,
  TableArea,
} from "../Financeiro.styles";
import { ListError } from "../ListError";
import { useCategorias } from "../useCategorias";

const SKELETON_ROWS = 6;

type TipoFiltro = "todos" | "receitas" | "despesas";

const TIPOS: { value: TipoFiltro; label: string }[] = [
  { value: "todos", label: "Todas" },
  { value: "receitas", label: "Receitas" },
  { value: "despesas", label: "Despesas" },
];

const TIPO_POR_FILTRO: Record<TipoFiltro, TipoLancamento | undefined> = {
  todos: undefined,
  receitas: TIPO_LANCAMENTO.Entrada,
  despesas: TIPO_LANCAMENTO.Saida,
};

export interface CategoriasListaProps {
  onNova: () => void;
  onEditar: (categoria: FinanceiroCategoria) => void;
}

function SecaoCategorias({ titulo, nos, onEditar }: { titulo: string; nos: NoCategoria[]; onEditar: (categoria: FinanceiroCategoria) => void }) {
  if (nos.length === 0) {
    return null;
  }

  const linha = (categoria: FinanceiroCategoria, nome: React.ReactNode) => (
    <TableRow key={categoria.financeiroCategoriaId}>
      <TableCell data-label="Nome">{nome}</TableCell>
      <TableCell data-label="Situação">
        <StatusBadge tone={categoria.ativo ? "success" : "neutral"}>{categoria.ativo ? "Ativa" : "Inativa"}</StatusBadge>
      </TableCell>
      <TableCell data-label="Ações" align="right">
        <RowActions>
          <IconButton type="button" aria-label={`Editar ${categoria.nome}`} title="Editar" onClick={() => onEditar(categoria)}>
            <EditIcon />
          </IconButton>
        </RowActions>
      </TableCell>
    </TableRow>
  );

  return (
    <Secao aria-label={titulo}>
      <SecaoTitulo>{titulo}</SecaoTitulo>
      <TableArea $refreshing={false}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell head>Nome</TableCell>
              <TableCell head>Situação</TableCell>
              <TableCell head align="right">
                Ações
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {nos.flatMap((no) => [
              linha(no.categoria, no.soContexto ? <NomeContexto>{no.categoria.nome}</NomeContexto> : <Primary>{no.categoria.nome}</Primary>),
              ...no.filhas.map((filha) => linha(filha, <NomeFilha>{filha.nome}</NomeFilha>)),
            ])}
          </TableBody>
        </Table>
      </TableArea>
    </Secao>
  );
}

export function CategoriasLista({ onNova, onEditar }: CategoriasListaProps) {
  const { data, isPending, isError, error, refetch, isFetching } = useCategorias();
  const [tipo, setTipo] = useState<TipoFiltro>("todos");
  const [situacao, setSituacao] = useState<Situacao>("ativas");

  if (isError) {
    return <ListError error={error} what="as categorias" onRetry={() => void refetch()} retrying={isFetching} />;
  }

  if (isPending) {
    return (
      <TableArea $refreshing={false} role="status" aria-label="Carregando categorias">
        <SkeletonRows>
          {Array.from({ length: SKELETON_ROWS }, (_, indice) => (
            <Skeleton key={indice} height="20px" />
          ))}
        </SkeletonRows>
      </TableArea>
    );
  }

  if (data.length === 0) {
    return (
      <EmptyState>
        <Text variant="muted">Nenhuma categoria cadastrada.</Text>
        <Text variant="muted">Crie categorias de receita e de despesa para lançar valores. Ex.: Aluguel, Salários, Manutenção.</Text>
        <Button type="button" onClick={onNova}>
          Nova categoria
        </Button>
      </EmptyState>
    );
  }

  const { receitas, despesas } = separarPorTipo(montarArvore(data, { tipo: TIPO_POR_FILTRO[tipo], situacao }));
  const filtrando = tipo !== "todos" || situacao !== "ativas";

  return (
    <Conteudo>
      <Filtros>
        <OptionGroup legend="Tipo" options={TIPOS} value={tipo} onChange={(valor) => setTipo(valor as TipoFiltro)} columns={3} />
        <Select label="Situação" value={situacao} onChange={(event) => setSituacao(event.target.value as Situacao)}>
          <option value="ativas">Ativas</option>
          <option value="inativas">Inativas</option>
          <option value="todas">Todas</option>
        </Select>
      </Filtros>
      {receitas.length === 0 && despesas.length === 0 ? (
        <EmptyState>
          <Text variant="muted">Nenhuma categoria com esses filtros.</Text>
          {filtrando && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setTipo("todos");
                setSituacao("ativas");
              }}
            >
              Limpar filtros
            </Button>
          )}
        </EmptyState>
      ) : (
        <>
          <SecaoCategorias titulo="Receitas" nos={receitas} onEditar={onEditar} />
          <SecaoCategorias titulo="Despesas" nos={despesas} onEditar={onEditar} />
        </>
      )}
    </Conteudo>
  );
}
