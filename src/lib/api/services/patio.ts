import type { ComprovanteCliente, EntradaPayload, EntradaRegistrada } from "@/types/veiculo";
import type { SaidaBusca, SaidaBuscaTipo, SaidaConsulta, SaidaPayload, SaidaRegistrada } from "@/types/saida";
import { api } from "../client";
import { ApiError } from "../errors";

// Responde 200 ou 201; os erros (sem caixa aberto, veículo já no pátio, ticket em uso) sobem como ApiError.
export async function registrarEntrada(payload: EntradaPayload): Promise<EntradaRegistrada> {
  const { data } = await api.post<EntradaRegistrada>("/Patio/entrada", payload);
  return data;
}

// Público (sem login). [A CONFIRMAR] código devolvido para token inexistente: 404 e 400 são tratados como "não encontrado".
export async function consultarComprovante(token: string): Promise<ComprovanteCliente> {
  try {
    const { data } = await api.get<ComprovanteCliente>("/Patio/comprovante/cliente", { params: { token } });
    return data;
  } catch (error) {
    if (error instanceof ApiError && (error.kind === "not_found" || error.kind === "validation")) {
      throw new ApiError("not_found", "Comprovante não encontrado.", 404);
    }
    throw error;
  }
}

// Resolve o token do cupom em uma busca aceita por GET /Patio/saida (que não recebe `token`).
// [A CONFIRMAR] Se o back passar a aceitar `token` em /Patio/saida, trocar o corpo por { tipo: "token", valor: token }.
export async function resolverBuscaPorToken(token: string): Promise<SaidaBusca> {
  try {
    const comprovante = await consultarComprovante(token);
    return { tipo: "placa", valor: comprovante.placa };
  } catch (error) {
    if (error instanceof ApiError && error.kind === "not_found") {
      throw new ApiError("not_found", "Nenhum ticket aberto com este token.", 404);
    }
    throw error;
  }
}

// [A CONFIRMAR] O contrato mostra só `placa`; `sequencial` segue o nome do campo da resposta.
const PARAM_BY_TIPO: Record<SaidaBuscaTipo, string> = {
  placa: "placa",
  sequencial: "sequencial",
};

const TIPO_LABEL: Record<SaidaBuscaTipo, string> = {
  placa: "essa placa",
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
