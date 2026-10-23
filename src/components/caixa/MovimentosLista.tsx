"use client";

import { ReactNode, useState } from "react";
import { ErroSemPermissao } from "@/components/layout/ErroSemPermissao";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge, type StatusBadgeProps } from "@/components/ui/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/Table";
import { Text } from "@/components/ui/Text";
import { isForbiddenError } from "@/lib/api/errors";
import type { Movimento } from "@/types/caixa";
import { VisuallyHidden } from "./Caixa.styles";
import { rotuloTipoMovimento } from "./exportCsv";
import { formaPagamentoLabel, formatDateTime, formatMoeda } from "./format";
import {
  contarPorTipo,
  FILTRO_PADRAO,
  FILTROS_TIPO,
  filtrarMovimentos,
  filtroAtivo,
  opcoesDeTurno,
  paginar,
  type FiltroMovimentos,
  type FiltroTipo,
  type TurnoRef,
} from "./movimentos";
import { Acoes, Barra, Contagem, Esqueletos, Estado, GrupoTipo, Opcao, Raiz, Sub, Valor } from "./MovimentosLista.styles";

export const MOVIMENTOS_PAGE_SIZE = 20;

const TOM_TIPO: Record<Movimento["tipo"], NonNullable<StatusBadgeProps["tone"]>> = {
  entrada: "success",
  saida: "danger",
  sangria: "warn",
};

export interface MovimentosListaProps {
  // undefined = carregando.
  movimentos: Movimento[] | undefined;
  // Turnos do caixa, para filtrar e rotular; sem eles o filtro por turno não aparece.
  turnos?: TurnoRef[];
  isError?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  // Texto do vazio sem filtro (varia entre caixa aberto e extrato).
  vazio?: string;
  // Ações ao lado dos filtros (ex.: exportar), que recebem o que está filtrado na tela.
  renderAcoes?: (filtrados: Movimento[], filtrado: boolean) => ReactNode;
}

function turnoDe(movimento: Movimento, turnos: TurnoRef[] | undefined): string | null {
  if (movimento.turnoId === null) {
    return null;
  }
  const turno = turnos?.find((item) => item.turnoId === movimento.turnoId);
  return turno ? `Turno de ${turno.usuario}` : `Turno ${movimento.turnoId}`;
}

export function MovimentosLista({
  movimentos,
  turnos,
  isError = false,
  error = null,
  onRetry,
  vazio = "Ainda não há movimentos neste caixa.",
  renderAcoes,
}: MovimentosListaProps) {
  const [filtro, setFiltro] = useState<FiltroMovimentos>(FILTRO_PADRAO);
  const [pagina, setPagina] = useState(1);

  if (isError) {
    if (error && isForbiddenError(error)) {
      return <ErroSemPermissao />;
    }
    return (
      <Estado>
        <ErrorBanner role="alert">{error?.message ?? "Não foi possível carregar os movimentos."}</ErrorBanner>
        {onRetry && (
          <Button type="button" variant="secondary" onClick={onRetry}>
            Tentar novamente
          </Button>
        )}
      </Estado>
    );
  }

  if (movimentos === undefined) {
    return (
      <Esqueletos role="status" aria-busy="true">
        <VisuallyHidden>Carregando movimentos…</VisuallyHidden>
        {[0, 1, 2, 3].map((indice) => (
          <Skeleton key={indice} height="44px" />
        ))}
      </Esqueletos>
    );
  }

  const contagem = contarPorTipo(movimentos);
  const filtrados = filtrarMovimentos(movimentos, filtro);
  const filtrado = filtroAtivo(filtro);
  const { itens, page, totalPages, totalRecords } = paginar(filtrados, pagina, MOVIMENTOS_PAGE_SIZE);

  function escolherTipo(tipo: FiltroTipo) {
    setFiltro((atual) => ({ ...atual, tipo }));
    setPagina(1);
  }

  function escolherTurno(valor: string) {
    setFiltro((atual) => ({ ...atual, turnoId: valor === "" ? null : Number(valor) }));
    setPagina(1);
  }

  function limpar() {
    setFiltro(FILTRO_PADRAO);
    setPagina(1);
  }

  if (movimentos.length === 0) {
    return (
      <Estado>
        <Text variant="muted">{vazio}</Text>
      </Estado>
    );
  }

  return (
    <Raiz>
      <Barra>
        <GrupoTipo role="group" aria-label="Tipo de movimento">
          {FILTROS_TIPO.map((opcao) => (
            <Opcao key={opcao.id} type="button" $ativa={filtro.tipo === opcao.id} aria-pressed={filtro.tipo === opcao.id} onClick={() => escolherTipo(opcao.id)}>
              {opcao.label}
              <Contagem>{contagem[opcao.id]}</Contagem>
            </Opcao>
          ))}
        </GrupoTipo>
        <Acoes>
          {turnos && turnos.length > 0 && (
            <Select label="Turno" value={filtro.turnoId === null ? "" : String(filtro.turnoId)} onChange={(event) => escolherTurno(event.target.value)}>
              <option value="">Todos os turnos</option>
              {opcoesDeTurno(turnos).map((opcao) => (
                <option key={opcao.value} value={opcao.value}>
                  {opcao.label}
                </option>
              ))}
            </Select>
          )}
          {renderAcoes?.(filtrados, filtrado)}
        </Acoes>
      </Barra>

      <VisuallyHidden role="status" aria-live="polite">
        {filtrados.length === 1 ? "1 movimento" : `${filtrados.length} movimentos`}
      </VisuallyHidden>

      {filtrados.length === 0 ? (
        <Estado>
          <Text variant="muted">Nenhum movimento com esses filtros.</Text>
          <Button type="button" variant="secondary" size="sm" onClick={limpar}>
            Limpar filtros
          </Button>
        </Estado>
      ) : (
        <>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell head>Data/hora</TableCell>
                <TableCell head>Tipo</TableCell>
                <TableCell head>Forma</TableCell>
                <TableCell head>Usuário</TableCell>
                <TableCell head>Motivo</TableCell>
                <TableCell head align="right">
                  Valor
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {itens.map((movimento) => {
                const entrada = movimento.tipo === "entrada";
                const turno = turnoDe(movimento, turnos);
                return (
                  <TableRow key={`${movimento.movimentoId}-${movimento.dataHora}`}>
                    <TableCell data-label="Data/hora">{formatDateTime(movimento.dataHora)}</TableCell>
                    <TableCell data-label="Tipo">
                      <StatusBadge tone={TOM_TIPO[movimento.tipo]}>{rotuloTipoMovimento(movimento.tipo)}</StatusBadge>
                    </TableCell>
                    <TableCell data-label="Forma">
                      {movimento.formaPagamento === null ? "—" : formaPagamentoLabel(movimento.formaPagamento)}
                    </TableCell>
                    <TableCell data-label="Usuário">
                      {movimento.usuario || "—"}
                      {turno && <Sub>{turno}</Sub>}
                    </TableCell>
                    <TableCell data-label="Motivo">{movimento.motivo || "—"}</TableCell>
                    <TableCell align="right" numeric data-label="Valor">
                      <Valor $tom={entrada ? "success" : "danger"}>
                        {entrada ? "+" : "−"} {formatMoeda(movimento.valor)}
                      </Valor>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {totalPages > 1 && (
            <Pagination page={page} totalPages={totalPages} totalRecords={totalRecords} pageSize={MOVIMENTOS_PAGE_SIZE} onPageChange={setPagina} />
          )}
        </>
      )}
    </Raiz>
  );
}
