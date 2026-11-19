import { formatDataInput } from "@/lib/periodo";
import { TIPOS_PERIODO, TIPO_PERIODO_PADRAO, ehPeriodoAtual, inicioDoDia, type TipoPeriodo } from "./periodo";

export const DASHBOARD_PATH = "/dashboard";

// Qualquer coisa que leia parâmetros por nome (URLSearchParams e o ReadonlyURLSearchParams do Next).
export type LeitorDeParametros = { get(nome: string): string | null };

export type FiltrosDashboard = { tipo: TipoPeriodo; data: Date };

const DATA = /^(\d{4})-(\d{2})-(\d{2})$/;

// "2026-11-19" vira a data local; texto fora do formato ou dia que não existe ("2026-02-30") vira nulo.
function lerData(valor: string | null): Date | null {
  const partes = valor === null ? null : DATA.exec(valor);
  if (!partes) return null;
  const [ano, mes, dia] = [Number(partes[1]), Number(partes[2]), Number(partes[3])];
  const data = new Date(ano, mes - 1, dia);
  return data.getFullYear() === ano && data.getMonth() === mes - 1 && data.getDate() === dia ? data : null;
}

function lerTipo(valor: string | null): TipoPeriodo {
  return TIPOS_PERIODO.find((tipo) => tipo === valor) ?? TIPO_PERIODO_PADRAO;
}

// Sem parâmetros: o dia de hoje. Valor inválido cai no padrão. Data futura vira hoje: a API responderia 400.
export function lerFiltros(parametros: LeitorDeParametros, hoje: Date): FiltrosDashboard {
  const dia = inicioDoDia(hoje);
  const data = lerData(parametros.get("data"));
  return { tipo: lerTipo(parametros.get("periodo")), data: data && data <= dia ? data : dia };
}

// Só o que difere do padrão vai para o endereço. O período atual não grava a data: ele sempre é "o de hoje".
export function filtrosParaQuery(filtros: FiltrosDashboard, hoje: Date): Record<string, string> {
  return {
    ...(filtros.tipo !== TIPO_PERIODO_PADRAO ? { periodo: filtros.tipo } : {}),
    ...(!ehPeriodoAtual(filtros.tipo, filtros.data, hoje) ? { data: formatDataInput(filtros.data) } : {}),
  };
}

export function dashboardUrl(filtros: FiltrosDashboard, hoje: Date): string {
  const texto = new URLSearchParams(filtrosParaQuery(filtros, hoje)).toString();
  return texto === "" ? DASHBOARD_PATH : `${DASHBOARD_PATH}?${texto}`;
}

// A data da consulta (AAAA-MM-DD). Omitida no período atual, em que o servidor assume hoje.
export function dataParaApi(filtros: FiltrosDashboard, hoje: Date): string | undefined {
  return ehPeriodoAtual(filtros.tipo, filtros.data, hoje) ? undefined : formatDataInput(filtros.data);
}
