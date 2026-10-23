"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Link } from "@/components/ui/Link";
import { Text } from "@/components/ui/Text";
import { ApiError } from "@/lib/api/errors";
import type { CaixaFechado, Movimento } from "@/types/caixa";
import { arredondar } from "../agregados";
import { InfoList, Page, Panel, StatusRow, TitleGroup } from "../Caixa.styles";
import { baixarCsv, movimentosParaCsv } from "../exportCsv";
import { formatDateTime, formatMoeda } from "../format";
import { MovimentosLista } from "../MovimentosLista";
import { turnosDosMovimentos } from "../movimentos";
import { baixarExtratoPdf } from "../pdf/extratoPdf";
import { CAIXA_KEY } from "../useCaixa";
import { useEmpresaPdf } from "../useEmpresaPdf";
import { useMovimentosCaixa } from "../useMovimentosCaixa";

export interface ExtratoCaixaPageProps {
  caixaId: number;
}

// O extrato não traz os dados do caixa: aproveita a linha do histórico se a pessoa chegou por ela.
function useCaixaDoHistorico(caixaId: number): CaixaFechado | undefined {
  const queryClient = useQueryClient();
  const consultas = queryClient.getQueriesData<{ items: CaixaFechado[] }>({ queryKey: [...CAIXA_KEY, "historico"] });
  for (const [, pagina] of consultas) {
    const encontrado = pagina?.items?.find((caixa) => caixa.caixaId === caixaId);
    if (encontrado) {
      return encontrado;
    }
  }
  return undefined;
}

function somar(movimentos: Movimento[]) {
  let entradas = 0;
  let saidas = 0;
  for (const movimento of movimentos) {
    const valor = Number.isFinite(movimento.valor) ? movimento.valor : 0;
    if (movimento.tipo === "entrada") {
      entradas += valor;
    } else {
      saidas += valor;
    }
  }
  return { entradas: arredondar(entradas), saidas: arredondar(saidas) };
}

// Movimentos de um caixa já fechado (Administrador e Gerente), com exportação em CSV e PDF do que está filtrado.
export function ExtratoCaixaPage({ caixaId }: ExtratoCaixaPageProps) {
  const { data: movimentos, isError, error, refetch } = useMovimentosCaixa(caixaId);
  const caixa = useCaixaDoHistorico(caixaId);
  const empresa = useEmpresaPdf();
  const [gerandoPdf, setGerandoPdf] = useState(false);
  const [falhaPdf, setFalhaPdf] = useState(false);

  const voltar = <Link href="/caixa/historico">Voltar aos caixas anteriores</Link>;

  if (isError && error instanceof ApiError && error.kind === "not_found") {
    return (
      <Page>
        <TitleGroup>
          <Text variant="heading" as="h1">
            Caixa não encontrado
          </Text>
          {voltar}
        </TitleGroup>
      </Page>
    );
  }

  if (isError && error instanceof ApiError && error.kind === "validation") {
    return (
      <Page>
        <TitleGroup>
          <Text variant="heading" as="h1">
            Extrato do caixa {caixaId}
          </Text>
          {voltar}
        </TitleGroup>
        <StatusRow>
          <ErrorBanner role="alert">{error.message}</ErrorBanner>
          <Link href="/caixa">Ir para o caixa aberto</Link>
        </StatusRow>
      </Page>
    );
  }

  const totais = movimentos ? somar(movimentos) : null;

  async function baixarPdf(filtrados: Movimento[], filtrado: boolean) {
    setGerandoPdf(true);
    setFalhaPdf(false);
    try {
      await baixarExtratoPdf({
        caixa: caixa ?? { caixaId },
        movimentos: filtrados,
        empresa,
        filtro: filtrado ? "filtros aplicados na tela" : null,
      });
    } catch {
      setFalhaPdf(true);
    } finally {
      setGerandoPdf(false);
    }
  }

  return (
    <Page>
      <TitleGroup>
        <Text variant="heading" as="h1">
          Extrato do caixa {caixaId}
        </Text>
        {voltar}
      </TitleGroup>

      <Panel aria-label="Resumo do caixa">
        <InfoList>
          {caixa && (
            <>
              <div>
                <dt>Aberto em</dt>
                <dd>
                  {formatDateTime(caixa.dataHoraAbertura)}
                  {caixa.abriu ? ` por ${caixa.abriu}` : ""}
                </dd>
              </div>
              <div>
                <dt>Fechado em</dt>
                <dd>
                  {formatDateTime(caixa.dataHoraFechamento ?? null)}
                  {caixa.fechou ? ` por ${caixa.fechou}` : ""}
                </dd>
              </div>
              <div>
                <dt>Fundo de caixa</dt>
                <dd>{formatMoeda(caixa.valorFundoCaixa)}</dd>
              </div>
            </>
          )}
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

      {falhaPdf && <ErrorBanner role="alert">Não foi possível gerar o PDF. Tente novamente.</ErrorBanner>}

      <MovimentosLista
        movimentos={movimentos}
        turnos={movimentos ? turnosDosMovimentos(movimentos) : undefined}
        isError={isError}
        error={error}
        onRetry={() => void refetch()}
        vazio="Este caixa não teve movimentos."
        renderAcoes={(filtrados, filtrado) => (
          <>
            <Button type="button" variant="secondary" onClick={() => baixarCsv(`extrato-caixa-${caixaId}`, movimentosParaCsv(filtrados))}>
              {filtrado ? "Baixar CSV (filtrado)" : "Baixar CSV"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => void baixarPdf(filtrados, filtrado)} disabled={gerandoPdf}>
              {gerandoPdf ? "Gerando…" : filtrado ? "Baixar PDF (filtrado)" : "Baixar PDF"}
            </Button>
          </>
        )}
      />
    </Page>
  );
}
