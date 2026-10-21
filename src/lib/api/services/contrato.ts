import type { AceiteContrato, ContratoCliente, ContratoErroKind } from "@/types/contrato";
import { CONTRATO_STATUS, type ContratoStatus } from "@/types/mensalista";
import { api } from "../client";
import { ApiError } from "../errors";

// Erro do fluxo público do contrato, já classificado para a tela escolher a mensagem.
export class ContratoError extends ApiError {
  readonly contratoKind: ContratoErroKind;

  constructor(contratoKind: ContratoErroKind, source: ApiError) {
    super(source.kind, source.message, source.status, source.details);
    this.name = "ContratoError";
    this.contratoKind = contratoKind;
  }
}

// O back usa o mesmo 400 para casos diferentes (link vencido, token inválido, já aceito, documento que não confere).
// Enquanto não há códigos próprios, a mensagem (e o `code`, quando existir) decide. É o primeiro lugar a ajustar se o texto mudar.
export function classifyContratoError(error: ApiError): ContratoErroKind | null {
  if (error.kind === "rate_limited" || error.status === 429) return "rate-limited";
  if (error.kind === "not_found" || error.status === 404) return "invalido";
  if (error.kind !== "validation") return null;

  const codes = Array.isArray(error.details) ? error.details.map((item) => item.code ?? "").join(" ") : "";
  const text = `${error.message} ${codes}`;
  if (/j[aá]\s+aceit|ja_aceit/i.test(text)) return "ja-aceito";
  if (/expir|venc/i.test(text)) return "vencido";
  if (/documento|cpf|cnpj|confere/i.test(text)) return "documento";
  return "invalido";
}

function toContratoError(error: unknown): unknown {
  if (!(error instanceof ApiError)) return error;
  const kind = classifyContratoError(error);
  return kind ? new ContratoError(kind, error) : error;
}

function toStatus(value: unknown): ContratoStatus {
  return value === CONTRATO_STATUS.Aceito || value === CONTRATO_STATUS.Cancelado ? value : CONTRATO_STATUS.Pendente;
}

function textOrNull(value: unknown): string | null {
  return typeof value === "string" && value ? value : null;
}

// Públicos (sem login): o mensalista abre o link do e-mail.
export async function consultarContratoCliente(token: string): Promise<ContratoCliente> {
  try {
    const { data } = await api.get<Record<string, unknown>>("/Mensalista/contrato/cliente", { params: { token } });
    return {
      razaoSocial: String(data.razaoSocial ?? ""),
      nomeMensalista: String(data.nomeMensalista ?? ""),
      versao: String(data.versao ?? ""),
      titulo: String(data.titulo ?? ""),
      conteudo: String(data.conteudo ?? ""),
      hash: String(data.hash ?? ""),
      status: toStatus(data.status),
      tokenExpiracao: textOrNull(data.tokenExpiracao),
      dataAceite: textOrNull(data.dataAceite),
    };
  } catch (error) {
    throw toContratoError(error);
  }
}

export async function aceitarContrato(token: string, documento: string): Promise<AceiteContrato> {
  try {
    const { data } = await api.post<AceiteContrato>("/Mensalista/contrato/cliente/aceitar", {
      token,
      // Sem máscara; o back aceita com ou sem.
      documento: documento.toUpperCase().replace(/[^0-9A-Z]/g, ""),
    });
    return { dataAceite: data.dataAceite, hash: data.hash };
  } catch (error) {
    throw toContratoError(error);
  }
}
