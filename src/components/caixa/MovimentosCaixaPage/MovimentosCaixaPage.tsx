"use client";

import { useMemo } from "react";
import { ErroSemPermissao } from "@/components/layout/ErroSemPermissao";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Link } from "@/components/ui/Link";
import { Text } from "@/components/ui/Text";
import { isForbiddenError } from "@/lib/api/errors";
import type { Movimento } from "@/types/caixa";
import { InfoList, Panel, StatusRow, TitleGroup } from "../Caixa.styles";
import { CaixaSkeleton } from "../CaixaSkeleton";
import { formatDateTime, formatMoeda } from "../format";
import { MovimentosLista } from "../MovimentosLista";
import { somarMovimentos, turnosDosMovimentos } from "../movimentos";
import { useCaixa } from "../useCaixa";
import { PaginaCentralizada as Page } from "./MovimentosCaixaPage.styles";

// Mais recente primeiro; o id desempata. Copia a lista para não mexer no cache da consulta.
function maisRecentesPrimeiro(movimentos: Movimento[]): Movimento[] {
  return [...movimentos].sort((a, b) => (a.dataHora < b.dataHora ? 1 : a.dataHora > b.dataHora ? -1 : b.movimentoId - a.movimentoId));
}

// Movimentos do caixa aberto, para conferência (tela grande).
export function MovimentosCaixaPage() {
  const { caixaQuery, caixa, movimentosQuery } = useCaixa();

  const movimentos = useMemo(
    () => (movimentosQuery.data ? maisRecentesPrimeiro(movimentosQuery.data) : undefined),
    [movimentosQuery.data],
  );

  const voltar = <Link href="/caixa">Voltar ao caixa</Link>;
  const titulo = (
    <TitleGroup>
      <Text variant="heading" as="h1">
        Movimentos do caixa
      </Text>
      {voltar}
    </TitleGroup>
  );

  if (caixaQuery.isPending) {
    return (
      <Page>
        {titulo}
        <CaixaSkeleton />
      </Page>
    );
  }

  if (caixaQuery.isError && isForbiddenError(caixaQuery.error)) {
    return <ErroSemPermissao />;
  }

  if (caixaQuery.isError) {
    return (
      <Page>
        {titulo}
        <StatusRow>
          <ErrorBanner role="alert">{caixaQuery.error.message}</ErrorBanner>
          <Button type="button" variant="secondary" onClick={() => void caixaQuery.refetch()} disabled={caixaQuery.isFetching}>
            Tentar novamente
          </Button>
        </StatusRow>
      </Page>
    );
  }

  if (caixa === null) {
    return (
      <Page>
        {titulo}
        <StatusRow>
          <Text variant="muted">Não há caixa aberto.</Text>
          <Link href="/caixa">Ir para o caixa</Link>
        </StatusRow>
      </Page>
    );
  }

  const totais = movimentos ? somarMovimentos(movimentos) : null;

  return (
    <Page>
      {titulo}

      <Panel aria-label="Resumo do caixa">
        <InfoList>
          <div>
            <dt>Aberto em</dt>
            <dd>{formatDateTime(caixa.dataHoraAbertura)}</dd>
          </div>
          {totais && (
            <>
              <div>
                <dt>Entradas</dt>
                <dd>{formatMoeda(totais.entradas)}</dd>
              </div>
              <div>
                <dt>Saídas e retiradas</dt>
                <dd>{formatMoeda(totais.saidas)}</dd>
              </div>
            </>
          )}
        </InfoList>
      </Panel>

      <MovimentosLista
        movimentos={movimentos}
        turnos={movimentos ? turnosDosMovimentos(movimentos) : undefined}
        isError={movimentosQuery.isError}
        error={movimentosQuery.error}
        onRetry={() => void movimentosQuery.refetch()}
        vazio="Ainda não há movimentos neste caixa."
      />
    </Page>
  );
}
