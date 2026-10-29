import type { Conveniada, ConveniadaFormValues, ConveniadaResultado, SituacaoFiltro } from "@/types/conveniada";
import { api } from "../client";
import { fromConveniadasResponse, fromResultadoResponse, toConveniadaPayload } from "./conveniada.mapper";

const PARAMS_POR_SITUACAO: Record<SituacaoFiltro, { ativo: boolean } | undefined> = {
  todos: undefined,
  ativos: { ativo: true },
  encerrados: { ativo: false },
};

// O back devolve a lista inteira, sem paginação, em ordem de nome.
export async function listConveniadas(situacao: SituacaoFiltro): Promise<Conveniada[]> {
  const params = PARAMS_POR_SITUACAO[situacao];
  const { data } = await api.get<unknown>("/Empresa/conveniada", params ? { params } : undefined);
  return fromConveniadasResponse(data);
}

// Rejeita com ApiError; a mensagem de regra de negócio (400) vem do back.
export async function cadastrarConveniada(values: ConveniadaFormValues): Promise<ConveniadaResultado> {
  const { data } = await api.post<unknown>("/Empresa/conveniada", toConveniadaPayload(values));
  return fromResultadoResponse(data);
}
