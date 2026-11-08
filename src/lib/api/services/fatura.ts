import type { Paginado } from "@/lib/api/types";
import type { EmitirFaturaValues, Fatura, FaturaDetalhe, FaturaFiltros, PagarFaturaValues } from "@/types/fatura";
import { api } from "../client";
import { fromFaturaDetalheResponse, fromFaturaResponse, toEmitirPayload, toPagarPayload } from "./fatura.mapper";

export const FATURAS_POR_PAGINA = 20;

type Dto = Record<string, unknown>;

function itens(data: unknown): Dto[] {
  return Array.isArray(data) ? data.filter((item): item is Dto => !!item && typeof item === "object") : [];
}

// Junta todas as saídas em aberto da conveniada. Valores em reais; o vencimento vai como AAAA-MM-DD.
export async function emitirFatura(values: EmitirFaturaValues): Promise<FaturaDetalhe> {
  const { data } = await api.post<unknown>("/Fatura", toEmitirPayload(values));
  return fromFaturaDetalheResponse(data);
}

// Da emissão mais recente para a mais antiga, sem as saídas. Só os filtros preenchidos vão na consulta.
export async function listFaturas(filtros: FaturaFiltros, tamanhoPagina: number = FATURAS_POR_PAGINA): Promise<Paginado<Fatura>> {
  const { data } = await api.get<Partial<Paginado<Dto>>>("/Fatura", {
    params: {
      ...(filtros.empresaConveniadaId ? { empresaConveniadaId: filtros.empresaConveniadaId } : {}),
      ...(filtros.situacao ? { situacao: filtros.situacao } : {}),
      pagina: filtros.pagina,
      tamanhoPagina,
    },
  });
  return {
    items: itens(data?.items).map(fromFaturaResponse),
    page: data?.page ?? filtros.pagina,
    pageSize: data?.pageSize ?? tamanhoPagina,
    totalRecords: data?.totalRecords ?? 0,
    totalPages: data?.totalPages ?? 0,
  };
}

export async function getFatura(id: number): Promise<FaturaDetalhe> {
  const { data } = await api.get<unknown>(`/Fatura/${id}`);
  return fromFaturaDetalheResponse(data);
}

// Só fatura aberta. [A CONFIRMAR no Swagger do back] verbo e caminho: o pedido descreve a regra mas não mostra a chamada;
// assumido PUT .../pagar, como o cancelamento de lançamento do Financeiro. A resposta é ignorada: a tela refaz a consulta.
export async function pagarFatura(id: number, values: PagarFaturaValues, hoje: string): Promise<void> {
  await api.put(`/Fatura/${id}/pagar`, toPagarPayload(values, hoje));
}

// Só fatura aberta. Não apaga: a fatura fica cancelada e as saídas voltam a ficar em aberto. Sem corpo.
// [A CONFIRMAR no Swagger do back] verbo, assumido PUT. A resposta é ignorada.
export async function cancelarFatura(id: number): Promise<void> {
  await api.put(`/Fatura/${id}/cancelar`);
}
