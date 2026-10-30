import type { Paginado } from "@/lib/api/types";
import type {
  CategoriaFormValues,
  FinanceiroCategoria,
  FluxoCaixa,
  FluxoParams,
  Lancamento,
  LancamentoFiltros,
  LancamentoFormValues,
} from "@/types/financeiro";
import { api } from "../client";
import {
  fromCategoriaResponse,
  fromFluxoResponse,
  fromLancamentoResponse,
  toCategoriaPayload,
  toLancamentoPayload,
} from "./financeiro.mapper";

export const LANCAMENTOS_POR_PAGINA = 20;

type Dto = Record<string, unknown>;

function itens(data: unknown): Dto[] {
  return Array.isArray(data) ? data.filter((item): item is Dto => !!item && typeof item === "object") : [];
}

// Valores em reais; as datas vão como AAAA-MM-DD (o back lê "01/10/2026" como mês/dia).
export async function getFluxo(params: FluxoParams): Promise<FluxoCaixa> {
  const { data } = await api.get<Dto>("/Financeiro/fluxo", { params });
  return fromFluxoResponse(data ?? {});
}

// Do pagamento mais recente para o mais antigo. Só os filtros preenchidos vão na consulta.
export async function listLancamentos(filtros: LancamentoFiltros, tamanhoPagina: number = LANCAMENTOS_POR_PAGINA): Promise<Paginado<Lancamento>> {
  const { data } = await api.get<Partial<Paginado<Dto>>>("/Financeiro/lancamento", {
    params: {
      ...(filtros.de ? { dataInicio: filtros.de } : {}),
      ...(filtros.ate ? { dataFim: filtros.ate } : {}),
      ...(filtros.tipo ? { tipo: filtros.tipo } : {}),
      ...(filtros.financeiroCategoriaId ? { financeiroCategoriaId: filtros.financeiroCategoriaId } : {}),
      ...(filtros.incluirCancelados ? { incluirCancelados: true } : {}),
      pagina: filtros.pagina,
      tamanhoPagina,
    },
  });
  return {
    items: itens(data?.items).map(fromLancamentoResponse),
    page: data?.page ?? filtros.pagina,
    pageSize: data?.pageSize ?? tamanhoPagina,
    totalRecords: data?.totalRecords ?? 0,
    totalPages: data?.totalPages ?? 0,
  };
}

export async function getLancamento(id: number): Promise<Lancamento> {
  const { data } = await api.get<Dto>(`/Financeiro/lancamento/${id}`);
  return fromLancamentoResponse(data ?? {});
}

export async function createLancamento(values: LancamentoFormValues): Promise<void> {
  await api.post("/Financeiro/lancamento", toLancamentoPayload(values));
}

// `atual` é o lançamento como está no back: num lançamento feito pelo caixa, valor, data e forma saem dele.
export async function updateLancamento(id: number, values: LancamentoFormValues, atual: Lancamento): Promise<void> {
  await api.put(`/Financeiro/lancamento/${id}`, toLancamentoPayload(values, atual));
}

// Não apaga: o lançamento fica cancelado e sai do fluxo. Sem corpo.
export async function cancelarLancamento(id: number): Promise<void> {
  await api.put(`/Financeiro/lancamento/${id}/cancelar`);
}

// Ativas e inativas, categorias pai seguidas das filhas (ordem do back). Os filtros de tipo e situação ficam na tela.
export async function listCategorias(): Promise<FinanceiroCategoria[]> {
  const { data } = await api.get<unknown>("/Financeiro/categoria");
  return itens(data).map(fromCategoriaResponse);
}

export async function createCategoria(values: CategoriaFormValues): Promise<void> {
  await api.post("/Financeiro/categoria", toCategoriaPayload(values, true));
}

export async function updateCategoria(id: number, values: CategoriaFormValues): Promise<void> {
  await api.put(`/Financeiro/categoria/${id}`, toCategoriaPayload(values));
}
