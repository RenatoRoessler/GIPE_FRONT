import type { EntradaPayload, EntradaRegistrada } from "@/types/veiculo";
import type { SaidaBusca, SaidaBuscaTipo, SaidaConsulta, SaidaPayload, SaidaRegistrada } from "@/types/saida";
import { api } from "../client";
import { ApiError } from "../errors";

// Responde 200 ou 201; os erros (sem caixa aberto, veículo já no pátio, ticket em uso) sobem como ApiError.
export async function registrarEntrada(payload: EntradaPayload): Promise<EntradaRegistrada> {
  const { data } = await api.post<EntradaRegistrada>("/Patio/entrada", payload);
  return data;
}

// [A CONFIRMAR] O contrato mostra só `placa`; `codigoTicket` e `sequencial` seguem o nome dos campos da resposta.
const PARAM_BY_TIPO: Record<SaidaBuscaTipo, string> = {
  placa: "placa",
  codigoTicket: "codigoTicket",
  sequencial: "sequencial",
};

const TIPO_LABEL: Record<SaidaBuscaTipo, string> = {
  placa: "essa placa",
  codigoTicket: "esse ticket",
  sequencial: "esse sequencial",
};

// A API aceita exatamente um parâmetro (mais de um devolve 400). O valor calculado depende do instante da chamada.
export async function consultarSaida(busca: SaidaBusca): Promise<SaidaConsulta> {
  try {
    const { data } = await api.get<SaidaConsulta>("/Patio/saida", {
      params: { [PARAM_BY_TIPO[busca.tipo]]: busca.valor },
    });
    return data;
  } catch (error) {
    if (error instanceof ApiError && error.kind === "not_found") {
      throw new ApiError("not_found", `Nenhum veículo no pátio com ${TIPO_LABEL[busca.tipo]}.`, 404);
    }
    throw error;
  }
}

export async function registrarSaida(patioId: number, payload: SaidaPayload): Promise<SaidaRegistrada> {
  try {
    const { data } = await api.post<SaidaRegistrada>(`/Patio/${patioId}/saida`, payload);
    return data;
  } catch (error) {
    if (error instanceof ApiError && error.kind === "not_found") {
      throw new ApiError("not_found", "O veículo não está no pátio.", 404);
    }
    throw error;
  }
}
