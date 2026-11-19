"use client";

import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Dashboard } from "@/types/dashboard";
import { indicadoresDoMes, rotuloFaturamento, textoComparacao } from "../apresentacao";
import { brl } from "../format";
import { PainelDashboard } from "../PainelDashboard";
import { Variacao } from "../Variacao";
import {
  BoasVindas,
  BoasVindasIcone,
  BoasVindasTexto,
  BoasVindasTitulo,
  Indicador,
  IndicadorRotulo,
  IndicadorSubtexto,
  IndicadorValor,
  Indicadores,
  Valor,
} from "./CardFaturamento.styles";

export interface CardFaturamentoProps {
  dashboard: Dashboard;
  // O dia de hoje, para os textos que dizem o ano só quando ele difere do atual.
  hoje: Date;
}

function IconeGrafico() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </svg>
  );
}

// O destaque da tela: quanto entrou no período, como isso se compara ao anterior e o que o mês indica. Empresa que ainda não
// registrou nenhuma saída (sem início de uso) recebe boas-vindas em vez de números sem base.
export function CardFaturamento({ dashboard, hoje }: CardFaturamentoProps) {
  const { periodo } = dashboard;
  const titulo = rotuloFaturamento(dashboard, hoje);

  if (dashboard.inicioUso === null) {
    return (
      <PainelDashboard titulo="Faturamento">
        <BoasVindas>
          <BoasVindasIcone aria-hidden="true">
            <IconeGrafico />
          </BoasVindasIcone>
          <BoasVindasTitulo>Seu faturamento aparece aqui</BoasVindasTitulo>
          <BoasVindasTexto>Assim que a primeira saída for registrada, você acompanha o dia, o mês e a projeção de fechamento.</BoasVindasTexto>
        </BoasVindas>
      </PainelDashboard>
    );
  }

  const comparacao = textoComparacao(dashboard, hoje);
  const variacao = periodo.comparacao?.variacaoPercentual ?? null;

  return (
    <PainelDashboard titulo={titulo} acessorio={periodo.fechado ? <StatusBadge tone="neutral">Fechado</StatusBadge> : undefined} posicaoAcessorio="inicio">
      <Valor>{brl(periodo.faturamento, { centavos: true })}</Valor>
      {comparacao !== null && variacao !== null && <Variacao valor={variacao} texto={comparacao} />}
      <Indicadores>
        {indicadoresDoMes(dashboard, hoje).map((indicador) => (
          <Indicador key={indicador.rotulo}>
            <IndicadorRotulo>{indicador.rotulo}</IndicadorRotulo>
            <IndicadorValor $espera={indicador.espera}>{indicador.valor}</IndicadorValor>
            {indicador.subtexto !== null && <IndicadorSubtexto $tom={indicador.tom}>{indicador.subtexto}</IndicadorSubtexto>}
          </Indicador>
        ))}
      </Indicadores>
    </PainelDashboard>
  );
}
