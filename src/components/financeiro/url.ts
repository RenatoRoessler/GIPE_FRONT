import { mesCorrente } from "@/lib/periodo";
import { AGRUPAMENTO_FLUXO, TIPO_LANCAMENTO, type AgrupamentoFluxo, type LancamentoFiltros, type TipoLancamento } from "@/types/financeiro";

export const ABAS = [
  { id: "fluxo", label: "Fluxo de caixa" },
  { id: "lancamentos", label: "Lançamentos" },
  { id: "categorias", label: "Categorias" },
] as const;

export type AbaId = (typeof ABAS)[number]["id"];

// Qualquer coisa que leia parâmetros por nome (URLSearchParams e o ReadonlyURLSearchParams do Next).
export type LeitorDeParametros = { get(nome: string): string | null };

const DATA = /^\d{4}-\d{2}-\d{2}$/;

// O fluxo é a aba padrão; valor desconhecido também cai nele.
export function parseAba(valor: string | null): AbaId {
  return ABAS.some((aba) => aba.id === valor) ? (valor as AbaId) : "fluxo";
}

export type FluxoUrl = { de: string; ate: string; ver: AgrupamentoFluxo };

// Sem as duas datas válidas, o fluxo abre no mês corrente, do primeiro ao último dia, agrupado por dia.
export function lerFluxo(parametros: LeitorDeParametros, hoje: Date): FluxoUrl {
  const de = parametros.get("de") ?? "";
  const ate = parametros.get("ate") ?? "";
  const periodo = DATA.test(de) && DATA.test(ate) ? { de, ate } : mesCorrente(hoje);
  return { ...periodo, ver: parametros.get("ver") === "mes" ? AGRUPAMENTO_FLUXO.Mes : AGRUPAMENTO_FLUXO.Dia };
}

// Só o que difere do padrão vai para o endereço.
export function fluxoParaQuery(fluxo: FluxoUrl, hoje: Date): Record<string, string> {
  const padrao = mesCorrente(hoje);
  return {
    ...(fluxo.de !== padrao.de || fluxo.ate !== padrao.ate ? { de: fluxo.de, ate: fluxo.ate } : {}),
    ...(fluxo.ver === AGRUPAMENTO_FLUXO.Mes ? { ver: "mes" } : {}),
  };
}

function lerTipo(valor: string | null): TipoLancamento | undefined {
  return valor === "entrada" ? TIPO_LANCAMENTO.Entrada : valor === "saida" ? TIPO_LANCAMENTO.Saida : undefined;
}

// Os nomes `lde` e `late` mantêm o período dos lançamentos separado do período do fluxo.
export function lerLancamentos(parametros: LeitorDeParametros): LancamentoFiltros {
  const de = parametros.get("lde") ?? "";
  const ate = parametros.get("late") ?? "";
  const categoria = Number(parametros.get("categoria"));
  const pagina = Number(parametros.get("pagina"));
  const tipo = lerTipo(parametros.get("tipo"));
  return {
    ...(DATA.test(de) ? { de } : {}),
    ...(DATA.test(ate) ? { ate } : {}),
    ...(tipo ? { tipo } : {}),
    ...(Number.isInteger(categoria) && categoria > 0 ? { financeiroCategoriaId: categoria } : {}),
    incluirCancelados: parametros.get("cancelados") === "1",
    pagina: Number.isInteger(pagina) && pagina >= 1 ? pagina : 1,
  };
}

export function lancamentosParaQuery(filtros: LancamentoFiltros): Record<string, string> {
  return {
    ...(filtros.de ? { lde: filtros.de } : {}),
    ...(filtros.ate ? { late: filtros.ate } : {}),
    ...(filtros.tipo ? { tipo: filtros.tipo === TIPO_LANCAMENTO.Saida ? "saida" : "entrada" } : {}),
    ...(filtros.financeiroCategoriaId ? { categoria: String(filtros.financeiroCategoriaId) } : {}),
    ...(filtros.incluirCancelados ? { cancelados: "1" } : {}),
    ...(filtros.pagina > 1 ? { pagina: String(filtros.pagina) } : {}),
  };
}

// Endereço de uma aba com seus parâmetros; o fluxo, por ser o padrão, fica sem `aba`.
export function financeiroUrl(aba: AbaId, query: Record<string, string> = {}): string {
  const parametros = new URLSearchParams(aba === "fluxo" ? {} : { aba });
  for (const [nome, valor] of Object.entries(query)) {
    parametros.set(nome, valor);
  }
  const texto = parametros.toString();
  return texto === "" ? "/financeiro" : `/financeiro?${texto}`;
}
