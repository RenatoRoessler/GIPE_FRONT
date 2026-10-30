"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { EditIcon } from "@/components/mensalistas/EditIcon";
import { Accordion, AccordionItem } from "@/components/ui/Accordion";
import { Button } from "@/components/ui/Button";
import { FiltroPeriodo } from "@/components/ui/FiltroPeriodo";
import { OptionGroup } from "@/components/ui/OptionGroup";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Switch } from "@/components/ui/Switch";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/Table";
import { Text } from "@/components/ui/Text";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { LANCAMENTOS_POR_PAGINA } from "@/lib/api/services/financeiro";
import { TIPO_LANCAMENTO, type FinanceiroCategoria, type Lancamento, type LancamentoFiltros, type TipoLancamento } from "@/types/financeiro";
import { formaPagamentoLabel } from "@/components/caixa/format";
import { opcoesDeCategoria, tipoDoLancamento, tipoPorCategoria } from "../categorias";
import { Conteudo, DescricaoBotao, EmptyState, Filtros, IconButton, LinhaDeLancamento, RowActions, Selos, SkeletonRows, SubText, TableArea, ValorLancamento } from "../Financeiro.styles";
import { formatDataBr, formatValorComSinal, nomeDaCategoria } from "../format";
import { ListError } from "../ListError";
import { useCategorias } from "../useCategorias";
import { useLancamentos } from "../useLancamentos";
import { financeiroUrl, lancamentosParaQuery, lerLancamentos } from "../url";

const SKELETON_ROWS = 8;

const TIPOS = [
  { value: "todos", label: "Todos" },
  { value: "entrada", label: "Entradas" },
  { value: "saida", label: "Saídas" },
];

export interface LancamentosListaProps {
  onNovo: () => void;
  onVerDetalhe: (lancamento: Lancamento) => void;
  onEditar: (lancamento: Lancamento) => void;
  onCancelar: (lancamento: Lancamento) => void;
  // Sem nenhuma categoria ativa não há como lançar: o estado vazio leva a criar a primeira.
  onCriarCategoria: () => void;
}

function CancelarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M5.6 5.6l12.8 12.8" />
    </svg>
  );
}

function quantidadeDeFiltros(filtros: LancamentoFiltros): number {
  return [filtros.de || filtros.ate, filtros.tipo, filtros.financeiroCategoriaId, filtros.incluirCancelados].filter(Boolean).length;
}

interface FiltrosDeLancamentoProps {
  filtros: LancamentoFiltros;
  categorias: FinanceiroCategoria[];
  disabled: boolean;
  onChange: (alteracao: Partial<LancamentoFiltros>) => void;
  onLimpar: () => void;
}

function FiltrosDeLancamento({ filtros, categorias, disabled, onChange, onLimpar }: FiltrosDeLancamentoProps) {
  const opcoes = opcoesDeCategoria(categorias, { tipo: filtros.tipo, apenasAtivas: false });
  const escolhida = categorias.find((categoria) => categoria.financeiroCategoriaId === filtros.financeiroCategoriaId);
  const ehPai = escolhida ? categorias.some((categoria) => categoria.financeiroCategoriaPaiId === escolhida.financeiroCategoriaId) : false;

  function mudarTipo(valor: string) {
    const tipo = valor === "entrada" ? TIPO_LANCAMENTO.Entrada : valor === "saida" ? TIPO_LANCAMENTO.Saida : undefined;
    // A categoria escolhida é de um tipo só: trocar para o outro tipo desfaz a escolha.
    const mantemCategoria = escolhida !== undefined && (tipo === undefined || escolhida.tipo === tipo);
    onChange({ tipo, financeiroCategoriaId: mantemCategoria ? escolhida.financeiroCategoriaId : undefined });
  }

  return (
    <Filtros>
      <FiltroPeriodo
        periodo={{ de: filtros.de ?? "", ate: filtros.ate ?? "" }}
        onAplicar={(periodo) => onChange({ de: periodo.de || undefined, ate: periodo.ate || undefined })}
        obrigatorio={false}
        disabled={disabled}
      />
      <OptionGroup
        legend="Tipo"
        options={TIPOS}
        value={filtros.tipo === TIPO_LANCAMENTO.Entrada ? "entrada" : filtros.tipo === TIPO_LANCAMENTO.Saida ? "saida" : "todos"}
        onChange={mudarTipo}
        disabled={disabled}
        columns={3}
      />
      <div>
        <Select
          label="Categoria"
          value={filtros.financeiroCategoriaId ? String(filtros.financeiroCategoriaId) : ""}
          onChange={(event) => onChange({ financeiroCategoriaId: event.target.value === "" ? undefined : Number(event.target.value) })}
          disabled={disabled}
        >
          <option value="">Todas as categorias</option>
          {opcoes.map((opcao) => (
            <option key={opcao.value} value={opcao.value}>
              {opcao.label}
            </option>
          ))}
        </Select>
        {ehPai && <SubText>Inclui as subcategorias.</SubText>}
      </div>
      <Switch label="Mostrar cancelados" checked={filtros.incluirCancelados} onCheckedChange={(marcado) => onChange({ incluirCancelados: marcado })} disabled={disabled} />
      {quantidadeDeFiltros(filtros) > 0 && (
        <Button type="button" variant="secondary" size="sm" onClick={onLimpar}>
          Limpar filtros
        </Button>
      )}
    </Filtros>
  );
}

export function LancamentosLista({ onNovo, onVerDetalhe, onEditar, onCancelar, onCriarCategoria }: LancamentosListaProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const filtros = useMemo(() => lerLancamentos(searchParams), [searchParams]);
  const { data, isPending, isError, error, refetch, isFetching } = useLancamentos(filtros);
  const categoriasQuery = useCategorias();
  const categorias = useMemo(() => categoriasQuery.data ?? [], [categoriasQuery.data]);
  const tipos = useMemo(() => tipoPorCategoria(categorias), [categorias]);

  const ir = useCallback(
    (proximos: LancamentoFiltros) => {
      router.replace(financeiroUrl("lancamentos", lancamentosParaQuery(proximos)), { scroll: false });
    },
    [router],
  );

  // Mudar qualquer filtro volta para a primeira página.
  const alterar = (alteracao: Partial<LancamentoFiltros>) => ir({ ...filtros, ...alteracao, pagina: 1 });
  const limpar = () => ir({ incluirCancelados: false, pagina: 1 });

  // Página que deixou de existir (por exemplo, depois de cancelar o último item): volta à última.
  useEffect(() => {
    if (data && data.totalPages > 0 && filtros.pagina > data.totalPages) {
      ir({ ...filtros, pagina: data.totalPages });
    }
  }, [data, filtros, ir]);

  const quantidade = quantidadeDeFiltros(filtros);
  const painelDeFiltros = (
    <FiltrosDeLancamento filtros={filtros} categorias={categorias} disabled={isFetching && !isError} onChange={alterar} onLimpar={limpar} />
  );
  const filtrosNaTela = isMobile ? (
    <Accordion>
      <AccordionItem title={quantidade > 0 ? `Filtros · ${quantidade}` : "Filtros"} open={filtrosAbertos} onOpenChange={setFiltrosAbertos}>
        {painelDeFiltros}
      </AccordionItem>
    </Accordion>
  ) : (
    painelDeFiltros
  );

  if (isError) {
    return <ListError error={error} what="os lançamentos" onRetry={() => void refetch()} retrying={isFetching} />;
  }

  if (isPending) {
    return (
      <TableArea $refreshing={false} role="status" aria-label="Carregando lançamentos">
        <SkeletonRows>
          {Array.from({ length: SKELETON_ROWS }, (_, indice) => (
            <Skeleton key={indice} height="20px" />
          ))}
        </SkeletonRows>
      </TableArea>
    );
  }

  const semCategoriaAtiva = categoriasQuery.isSuccess && !categorias.some((categoria) => categoria.ativo);

  if (data.items.length === 0) {
    return (
      <Conteudo>
        {filtrosNaTela}
        {quantidade > 0 ? (
          <EmptyState>
            <Text variant="muted">Nenhum lançamento com esses filtros.</Text>
            <Button type="button" variant="secondary" onClick={limpar}>
              Limpar filtros
            </Button>
          </EmptyState>
        ) : semCategoriaAtiva ? (
          <EmptyState>
            <Text variant="muted">Nenhum lançamento ainda.</Text>
            <Text variant="muted">Crie uma categoria de receita ou despesa antes de lançar.</Text>
            <Button type="button" onClick={onCriarCategoria}>
              Criar categoria
            </Button>
          </EmptyState>
        ) : (
          <EmptyState>
            <Text variant="muted">Nenhum lançamento ainda.</Text>
            <Button type="button" onClick={onNovo}>
              Novo lançamento
            </Button>
          </EmptyState>
        )}
      </Conteudo>
    );
  }

  return (
    <Conteudo>
      {filtrosNaTela}
      <TableArea $refreshing={isFetching}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell head>Data</TableCell>
              <TableCell head>Descrição</TableCell>
              <TableCell head>Categoria</TableCell>
              <TableCell head>Forma</TableCell>
              <TableCell head align="right">
                Valor
              </TableCell>
              <TableCell head align="right">
                Ações
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.items.map((lancamento) => {
              const tipo: TipoLancamento | null = tipoDoLancamento(lancamento, tipos);
              const secundario = [lancamento.favorecido, lancamento.documento].filter(Boolean).join(" · ");
              return (
                <LinhaDeLancamento key={lancamento.financeiroLancamentoId} $cancelado={lancamento.cancelado}>
                  <TableCell data-label="Data" numeric>
                    {formatDataBr(lancamento.dataPagamento)}
                  </TableCell>
                  <TableCell data-label="Descrição">
                    <DescricaoBotao type="button" onClick={() => onVerDetalhe(lancamento)}>
                      {lancamento.descricao || "Sem descrição"}
                    </DescricaoBotao>
                    {secundario && <SubText>{secundario}</SubText>}
                    {(lancamento.peloCaixa || lancamento.cancelado) && (
                      <Selos>
                        {lancamento.peloCaixa && <StatusBadge tone="info">Pelo caixa</StatusBadge>}
                        {lancamento.cancelado && <StatusBadge tone="neutral">Cancelado</StatusBadge>}
                      </Selos>
                    )}
                  </TableCell>
                  <TableCell data-label="Categoria">{nomeDaCategoria(lancamento.categoria, lancamento.categoriaPai)}</TableCell>
                  <TableCell data-label="Forma">{formaPagamentoLabel(lancamento.formaPagamento)}</TableCell>
                  <TableCell data-label="Valor" align="right" numeric>
                    <ValorLancamento
                      $sentido={tipo === TIPO_LANCAMENTO.Entrada ? "entrada" : tipo === TIPO_LANCAMENTO.Saida ? "saida" : "neutro"}
                      $cancelado={lancamento.cancelado}
                    >
                      {formatValorComSinal(lancamento.valor, tipo)}
                    </ValorLancamento>
                  </TableCell>
                  <TableCell data-label="Ações" align="right">
                    {!lancamento.cancelado && (
                      <RowActions>
                        <IconButton type="button" aria-label={`Editar ${lancamento.descricao}`} title="Editar" onClick={() => onEditar(lancamento)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton type="button" aria-label={`Cancelar ${lancamento.descricao}`} title="Cancelar lançamento" onClick={() => onCancelar(lancamento)}>
                          <CancelarIcon />
                        </IconButton>
                      </RowActions>
                    )}
                  </TableCell>
                </LinhaDeLancamento>
              );
            })}
          </TableBody>
        </Table>
      </TableArea>
      <Pagination
        page={data.page}
        totalPages={data.totalPages}
        totalRecords={data.totalRecords}
        pageSize={data.pageSize || LANCAMENTOS_POR_PAGINA}
        onPageChange={(pagina) => ir({ ...filtros, pagina })}
      />
    </Conteudo>
  );
}
