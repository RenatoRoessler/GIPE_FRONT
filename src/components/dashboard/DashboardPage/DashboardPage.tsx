"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useTheme } from "styled-components";
import { ErroSemPermissao } from "@/components/layout/ErroSemPermissao";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { useCurrentUser } from "@/contexts/CurrentUserContext";
import { useAgora } from "@/hooks/useAgora";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { parseApiDate } from "@/lib/date";
import { ApiError, isForbiddenError } from "@/lib/api/errors";
import { AREA, podeAcessar } from "@/lib/permissoes";
import { distribuicaoOrigem, distribuicaoRecebimento, pendencias, tituloDoMes } from "../apresentacao";
import { CabecalhoDashboard } from "../CabecalhoDashboard";
import { CardFaturamento } from "../CardFaturamento";
import { CardPatioAgora } from "../CardPatioAgora";
import { DashboardSkeleton } from "../DashboardSkeleton";
import { Distribuicao } from "../Distribuicao";
import { GraficoFaturamentoDiario } from "../GraficoFaturamentoDiario";
import { Blocos, Duas, Hero, Pagina, Tres } from "../grade.styles";
import { IndicadoresPeriodo } from "../IndicadoresPeriodo";
import { ListaPendencias } from "../ListaPendencias";
import { MovimentoPorHora } from "../MovimentoPorHora";
import { PorCategoria } from "../PorCategoria";
import { TIPO_PARA_API, deslocar, ehPeriodoAtual, inicioDoDia, podeVoltar as podeVoltarNoTempo, rotuloDoPeriodo, type TipoPeriodo } from "../periodo";
import { dashboardUrl, dataParaApi, lerFiltros, type FiltrosDashboard } from "../url";
import { useDashboard } from "../useDashboard";
import { AreaErro } from "./DashboardPage.styles";

// Visão Geral do Administrador. O período e a data vivem na URL (`?periodo=semana&data=2026-11-10`): o endereço pode ser
// compartilhado, o voltar do navegador funciona e as setas usam `replace` para não encher o histórico.
export function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const theme = useTheme();
  const { user, isLoading: carregandoUsuario } = useCurrentUser();
  const agoraEmMs = useAgora(60_000);
  const agora = useMemo(() => new Date(agoraEmMs), [agoraEmMs]);
  const hoje = useMemo(() => inicioDoDia(agora), [agora]);
  const celular = useMediaQuery(`(max-width: ${parseInt(theme.breakpoints.md, 10) - 1}px)`);

  const filtros = useMemo(() => lerFiltros(searchParams, hoje), [searchParams, hoje]);
  const { tipo, data } = filtros;
  const dataDaConsulta = dataParaApi(filtros, hoje);
  const consulta = useDashboard({ periodo: TIPO_PARA_API[tipo], data: dataDaConsulta });
  const dashboard = consulta.data;

  function irPara(proximo: FiltrosDashboard) {
    router.replace(dashboardUrl(proximo, hoje), { scroll: false });
  }

  // O servidor recusou a data (400): o relógio deste aparelho está adiantado em relação a ele. Volta ao período atual, que é
  // consultado sem data (o servidor assume o "hoje" dele) e corrige o endereço.
  const dataRecusada = consulta.isError && consulta.error instanceof ApiError && consulta.error.kind === "validation" && dataDaConsulta !== undefined;
  useEffect(() => {
    if (dataRecusada) router.replace(dashboardUrl({ tipo, data: hoje }, hoje), { scroll: false });
  }, [dataRecusada, router, tipo, hoje]);

  const itensDePendencia = useMemo(
    () => (dashboard && !dashboard.periodo.fechado ? pendencias(dashboard.alertas, (area) => podeAcessar(user?.perfil, area)) : []),
    [dashboard, user?.perfil],
  );

  // O proxy já barra a rota; se o perfil chegar aqui sem acesso (permissão alterada com a tela aberta), avisa em vez de ficar
  // carregando para sempre (sem acesso a consulta nem sai).
  if (!carregandoUsuario && !podeAcessar(user?.perfil, AREA.Inicio)) {
    return (
      <Pagina>
        <ErroSemPermissao />
      </Pagina>
    );
  }

  const periodoAtual = ehPeriodoAtual(tipo, data, hoje);
  const cabecalho = (
    <CabecalhoDashboard
      nome={user?.name}
      agora={agora}
      atualizadoEm={parseApiDate(dashboard?.dataReferencia)}
      tipo={tipo}
      rotulo={rotuloDoPeriodo(tipo, data, hoje)}
      podeVoltar={podeVoltarNoTempo(tipo, data, parseApiDate(dashboard?.inicioUso))}
      podeAvancar={!periodoAtual}
      mostrarVoltarParaHoje={!periodoAtual}
      onTipoChange={(proximo: TipoPeriodo) => irPara({ tipo: proximo, data: hoje })}
      onAnterior={() => irPara({ tipo, data: deslocar(tipo, data, -1) })}
      onProximo={() => {
        const seguinte = deslocar(tipo, data, 1);
        irPara({ tipo, data: seguinte > hoje ? hoje : seguinte });
      }}
      onVoltarParaHoje={() => irPara({ tipo, data: hoje })}
    />
  );

  if (consulta.isError && isForbiddenError(consulta.error)) {
    return (
      <Pagina>
        {cabecalho}
        <ErroSemPermissao />
      </Pagina>
    );
  }

  if (!dashboard) {
    return (
      <Pagina>
        {cabecalho}
        {consulta.isError && !dataRecusada ? (
          <AreaErro>
            <ErrorBanner role="alert">Não foi possível carregar a visão geral. {consulta.error.message}</ErrorBanner>
            <Button type="button" variant="secondary" onClick={() => void consulta.refetch()} disabled={consulta.isFetching}>
              Tentar de novo
            </Button>
          </AreaErro>
        ) : (
          <DashboardSkeleton />
        )}
      </Pagina>
    );
  }

  const emAndamento = !dashboard.periodo.fechado;
  const comPatio = emAndamento && dashboard.patio !== null;
  const grafico = <GraficoFaturamentoDiario dashboard={dashboard} hoje={hoje} />;
  const atencao = emAndamento ? <ListaPendencias itens={itensDePendencia} /> : null;

  return (
    <Pagina>
      {cabecalho}
      {consulta.isError && (
        <AreaErro>
          <ErrorBanner role="alert">Não foi possível atualizar a visão geral. Os dados abaixo podem estar desatualizados.</ErrorBanner>
          <Button type="button" variant="secondary" onClick={() => void consulta.refetch()} disabled={consulta.isFetching}>
            Tentar de novo
          </Button>
        </AreaErro>
      )}
      <Blocos aria-busy={consulta.isPlaceholderData} $esmaecido={consulta.isPlaceholderData}>
        <Hero $solo={!comPatio}>
          <CardFaturamento dashboard={dashboard} hoje={hoje} />
          {comPatio && dashboard.patio && <CardPatioAgora patio={dashboard.patio} />}
        </Hero>
        <IndicadoresPeriodo periodo={dashboard.periodo} />
        <Duas $solo={!emAndamento}>
          {/* No celular as pendências vêm antes do gráfico, e a ordem de tabulação acompanha a que se vê. */}
          {celular ? (
            <>
              {atencao}
              {grafico}
            </>
          ) : (
            <>
              {grafico}
              {atencao}
            </>
          )}
        </Duas>
        <Tres>
          <Distribuicao
            titulo={tituloDoMes("De onde vem o dinheiro", dashboard.mes, hoje)}
            distribuicao={distribuicaoOrigem(dashboard.origem)}
            vazio="Aparece quando houver faturamento no período."
          />
          <Distribuicao
            titulo={tituloDoMes("Como você recebe", dashboard.mes, hoje)}
            distribuicao={distribuicaoRecebimento(dashboard.recebimento)}
            vazio="Aparece quando houver recebimentos no período."
          />
          <PorCategoria categorias={dashboard.categorias} periodo={dashboard.periodo.tipo} />
          <MovimentoPorHora
            movimento={dashboard.movimentoPorHora}
            periodo={dashboard.periodo}
            inicioUso={dashboard.inicioUso}
            capacidade={dashboard.patio?.capacidade ?? 0}
            agora={agora}
          />
        </Tres>
      </Blocos>
    </Pagina>
  );
}
