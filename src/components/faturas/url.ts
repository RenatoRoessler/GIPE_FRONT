import { SITUACAO_FATURA, type FaturaFiltros, type SituacaoFatura } from "@/types/fatura";

export const LISTA_URL = "/faturas";

// O detalhe de uma fatura recém-emitida leva `emitida=1`, para mostrar o aviso de emissão uma vez.
export const EMITIDA_PARAM = "emitida";

export function faturaUrl(id: number, emitida = false): string {
  return emitida ? `${LISTA_URL}/${id}?${EMITIDA_PARAM}=1` : `${LISTA_URL}/${id}`;
}

// Qualquer coisa que leia parâmetros por nome (URLSearchParams e o ReadonlyURLSearchParams do Next).
export type LeitorDeParametros = { get(nome: string): string | null };

const SITUACAO_POR_SLUG: Record<string, SituacaoFatura> = {
  aberta: SITUACAO_FATURA.Aberta,
  paga: SITUACAO_FATURA.Paga,
  cancelada: SITUACAO_FATURA.Cancelada,
};

const SLUG_POR_SITUACAO: Record<SituacaoFatura, string> = {
  [SITUACAO_FATURA.Aberta]: "aberta",
  [SITUACAO_FATURA.Paga]: "paga",
  [SITUACAO_FATURA.Cancelada]: "cancelada",
};

function inteiroPositivo(valor: string | null): number | null {
  return valor && /^\d+$/.test(valor) && Number(valor) > 0 ? Number(valor) : null;
}

// Valor ausente ou inválido vira o padrão: sem filtro e página 1.
export function parseFiltros(parametros: LeitorDeParametros): FaturaFiltros {
  const situacao = parametros.get("situacao");
  return {
    empresaConveniadaId: inteiroPositivo(parametros.get("conveniada")),
    situacao: situacao !== null && Object.hasOwn(SITUACAO_POR_SLUG, situacao) ? SITUACAO_POR_SLUG[situacao] : null,
    pagina: inteiroPositivo(parametros.get("pagina")) ?? 1,
  };
}

// O padrão (sem filtro, página 1) não vai para a URL.
export function filtrosUrl(filtros: FaturaFiltros): string {
  const parametros = new URLSearchParams();
  if (filtros.empresaConveniadaId) {
    parametros.set("conveniada", String(filtros.empresaConveniadaId));
  }
  if (filtros.situacao) {
    parametros.set("situacao", SLUG_POR_SITUACAO[filtros.situacao]);
  }
  if (filtros.pagina > 1) {
    parametros.set("pagina", String(filtros.pagina));
  }
  const consulta = parametros.toString();
  return consulta ? `${LISTA_URL}?${consulta}` : LISTA_URL;
}

export const SEM_FILTROS: FaturaFiltros = { empresaConveniadaId: null, situacao: null, pagina: 1 };
