import { normalizePlaca } from "@/lib/placa";
import type { ChaveRef, PatioVeiculo } from "@/types/patio";
import type { ComprovanteCliente, EntradaPayload, EntradaRegistrada, ReciboCliente } from "@/types/veiculo";
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

// Público (sem login): recibo de uma saída, aberto pelo QR do recibo.
// [A CONFIRMAR] código devolvido para token inexistente: 404 e 400 são tratados como "não encontrado".
export async function consultarRecibo(token: string): Promise<ReciboCliente> {
  try {
    const { data } = await api.get<ReciboCliente>("/Patio/recibo/cliente", { params: { token } });
    return data;
  } catch (error) {
    if (error instanceof ApiError && (error.kind === "not_found" || error.kind === "validation")) {
      throw new ApiError("not_found", "Recibo não encontrado.", 404);
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

function toNumber(value: unknown): number | null {
  const number = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  return typeof number === "number" && Number.isFinite(number) ? number : null;
}

function toText(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

// "A2" ou "Recepção · A2": o nome do quadro é opcional e a posição é linha (letras) mais coluna (número).
const CHAVE_TEXTO = /^(?:(.+?)\s·\s)?([A-Za-z]{1,10})(\d{1,3})$/;

function chaveRefDoTexto(texto: string): ChaveRef | null {
  const partes = CHAVE_TEXTO.exec(texto);
  return partes ? { quadro: partes[1]?.trim() || null, linha: partes[2].toUpperCase(), coluna: Number(partes[3]) } : null;
}

// `quadroChaves` vem como objeto { quadroChaveId, posicao, patioQuadroId, quadro } (ou nulo); o texto pronto também é aceito.
// Devolve o texto do card ("A2" ou "Recepção · A2") e a posição em partes.
function lerChave(value: unknown): { posicaoChave: string | null; chaveRef: ChaveRef | null } {
  if (typeof value === "string") {
    const texto = toText(value)?.trim() ?? null;
    return { posicaoChave: texto, chaveRef: texto ? chaveRefDoTexto(texto) : null };
  }
  if (typeof value !== "object" || value === null) {
    return { posicaoChave: null, chaveRef: null };
  }
  const raw = value as Record<string, unknown>;
  // O back devolve `posicao` pronta ("B2"); `linha` e `coluna` separadas também valem.
  const daPosicao = typeof raw.posicao === "string" ? chaveRefDoTexto(raw.posicao.trim()) : null;
  const linha = daPosicao?.linha ?? toText(raw.linha)?.trim().toUpperCase();
  const coluna = daPosicao?.coluna ?? toNumber(raw.coluna);
  if (!linha || coluna === null) {
    return { posicaoChave: null, chaveRef: null };
  }
  const quadro = (toText(raw.quadro) ?? toText(raw.nome))?.trim() ?? null;
  const patioQuadroId = toNumber(raw.patioQuadroId);
  const patioQuadroChaveId = toNumber(raw.quadroChaveId) ?? toNumber(raw.patioQuadroChaveId);
  const posicao = `${linha}${coluna}`;
  return {
    posicaoChave: quadro ? `${quadro} · ${posicao}` : posicao,
    chaveRef: {
      quadro,
      linha,
      coluna,
      ...(patioQuadroId !== null ? { patioQuadroId } : {}),
      ...(patioQuadroChaveId !== null ? { patioQuadroChaveId } : {}),
    },
  };
}

// Tolerante: um campo ausente ou fora do formato não derruba a tela.
export function fromPatioResponse(raw: Record<string, unknown>): PatioVeiculo {
  return {
    patioId: toNumber(raw.patioId) ?? 0,
    placa: normalizePlaca(typeof raw.placa === "string" ? raw.placa : ""),
    categoria: toNumber(raw.categoria) ?? 0,
    modelo: toText(raw.modelo),
    cor: toText(raw.cor),
    codigoTicket: toNumber(raw.codigoTicket),
    sequencial: toNumber(raw.sequencial) ?? 0,
    mensalista: raw.mensalista === true,
    dataHoraEntrada: typeof raw.dataHoraEntrada === "string" ? raw.dataHoraEntrada : "",
    minutosPermanencia: toNumber(raw.minutosPermanencia) ?? 0,
    permanencia: typeof raw.permanencia === "string" ? raw.permanencia : "",
    rotatividadeDescricao: toText(raw.rotatividadeDescricao),
    usuarioEntrada: toText(raw.usuarioEntrada),
    token: toText(raw.token),
    ...lerChave(raw.quadroChaves),
  };
}

// Veículos que estão no pátio agora; o back não pagina nem filtra.
export async function listPatio(): Promise<PatioVeiculo[]> {
  const { data } = await api.get<unknown>("/Patio");
  return Array.isArray(data)
    ? data.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null).map(fromPatioResponse)
    : [];
}
