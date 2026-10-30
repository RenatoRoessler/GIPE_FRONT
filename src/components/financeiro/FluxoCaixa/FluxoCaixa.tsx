"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { FiltroPeriodo, type AtalhoPeriodo } from "@/components/ui/FiltroPeriodo";
import { OptionGroup } from "@/components/ui/OptionGroup";
import { Skeleton } from "@/components/ui/Skeleton";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { anoCorrente, mesAnterior, mesCorrente, validarPeriodo, type Periodo } from "@/lib/periodo";
import { AGRUPAMENTO_FLUXO } from "@/types/financeiro";
import { ComposicaoFluxo } from "../ComposicaoFluxo";
import { ListError } from "../ListError";
import { ReguaSaldo } from "../ReguaSaldo";
import { SaldoPeriodo } from "../SaldoPeriodo";
import { TabelaPeriodos } from "../TabelaPeriodos";
import { fluxoParaQuery, financeiroUrl, lerFluxo, type FluxoUrl } from "../url";
import { useFluxo } from "../useFluxo";
import { Blocos, Controles, Nota } from "./FluxoCaixa.styles";

const MAX_DIAS = 366;

const VER_POR = [
  { value: "dia", label: "Dia" },
  { value: "mes", label: "Mês" },
];

export interface FluxoCaixaProps {
  // "Lançar despesa", no lado das saídas quando não há nenhuma no período.
  onLancarDespesa: () => void;
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8v.01" />
    </svg>
  );
}

export function FluxoCaixa({ onLancarDespesa }: FluxoCaixaProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();
  const [hoje] = useState(() => new Date());
  const fluxoUrl = useMemo(() => lerFluxo(searchParams, hoje), [searchParams, hoje]);
  const periodo: Periodo = { de: fluxoUrl.de, ate: fluxoUrl.ate };

  // O endereço pode ter sido editado à mão: período inválido não vai para o back.
  const erros = validarPeriodo(periodo, { maxDias: MAX_DIAS });
  const periodoValido = !erros.de && !erros.ate;

  const { data, isPending, isError, error, refetch, isFetching } = useFluxo(
    { dataInicio: fluxoUrl.de, dataFim: fluxoUrl.ate, agrupamento: fluxoUrl.ver },
    { enabled: periodoValido },
  );

  const atalhos = useMemo<AtalhoPeriodo[]>(
    () => [
      { id: "mes", label: "Este mês", periodo: mesCorrente(hoje) },
      { id: "anterior", label: "Mês anterior", periodo: mesAnterior(hoje) },
      { id: "ano", label: "Este ano", periodo: anoCorrente(hoje) },
    ],
    [hoje],
  );

  const ir = useCallback(
    (proximo: FluxoUrl) => {
      router.replace(financeiroUrl("fluxo", fluxoParaQuery(proximo, hoje)), { scroll: false });
    },
    [router, hoje],
  );

  const controles = (
    <Controles>
      <FiltroPeriodo
        periodo={periodo}
        onAplicar={(novo) => ir({ ...fluxoUrl, ...novo })}
        maxDias={MAX_DIAS}
        atalhos={atalhos}
        rotuloAplicar="Aplicar"
        recolherCampos={isMobile}
        disabled={isFetching && !isError}
      />
      <OptionGroup
        legend="Ver por"
        options={VER_POR}
        value={fluxoUrl.ver === AGRUPAMENTO_FLUXO.Mes ? "mes" : "dia"}
        onChange={(valor) => ir({ ...fluxoUrl, ver: valor === "mes" ? AGRUPAMENTO_FLUXO.Mes : AGRUPAMENTO_FLUXO.Dia })}
        columns={2}
      />
    </Controles>
  );

  if (!periodoValido) {
    return (
      <Blocos $refreshing={false}>
        {controles}
        <ErrorBanner role="alert">{erros.ate ?? erros.de}</ErrorBanner>
      </Blocos>
    );
  }

  if (isError) {
    return (
      <Blocos $refreshing={false}>
        {controles}
        <ListError error={error} what="o fluxo de caixa" onRetry={() => void refetch()} retrying={isFetching} />
      </Blocos>
    );
  }

  if (isPending) {
    return (
      <Blocos $refreshing={false}>
        {controles}
        <div role="status" aria-label="Carregando fluxo de caixa">
          <Skeleton height="96px" />
        </div>
        <Skeleton height="160px" />
      </Blocos>
    );
  }

  return (
    <Blocos $refreshing={isFetching} aria-busy={isFetching}>
      {controles}
      <SaldoPeriodo fluxo={data} />
      <ReguaSaldo periodos={data.periodos} agrupamento={fluxoUrl.ver} onVerPorMes={() => ir({ ...fluxoUrl, ver: AGRUPAMENTO_FLUXO.Mes })} />
      <ComposicaoFluxo categorias={data.categorias} periodo={periodo} onLancarDespesa={onLancarDespesa} />
      <TabelaPeriodos periodos={data.periodos} agrupamento={fluxoUrl.ver} />
      <Nota>
        <InfoIcon />
        <span>Sangria e suprimento não entram no fluxo: o dinheiro só muda de lugar. Lançamentos feitos pelo caixa contam uma vez só, como lançamento.</span>
      </Nota>
    </Blocos>
  );
}
