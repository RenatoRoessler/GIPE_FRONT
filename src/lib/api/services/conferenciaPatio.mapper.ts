import { normalizePlaca } from "@/lib/placa";
import type {
  AjusteConferencia,
  ChaveItem,
  Conferencia,
  ConferenciaEmAndamento,
  ConferenciaEncerrada,
  ConferenciaResumo,
  ItemConferencia,
  ResultadoLeitura,
  SemEntrada,
} from "@/types/conferenciaPatio";
import { toNumber, toText } from "./mapperUtils";

type Raw = Record<string, unknown>;

function isRecord(value: unknown): value is Raw {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function records(value: unknown): Raw[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function fromChave(value: unknown): ChaveItem | null {
  if (!isRecord(value)) {
    return null;
  }
  const posicao = toText(value.posicao);
  if (posicao === null) {
    return null;
  }
  return {
    quadroChaveId: toNumber(value.quadroChaveId) ?? 0,
    posicao,
    patioQuadroId: toNumber(value.patioQuadroId) ?? 0,
    quadro: toText(value.quadro) ?? "",
  };
}

// Item sem identificador não dá para marcar: é descartado.
export function fromItemResponse(raw: Raw): ItemConferencia | null {
  const id = toNumber(raw.patioConferenciaItemId);
  if (id === null) {
    return null;
  }
  return {
    patioConferenciaItemId: id,
    patioId: toNumber(raw.patioId) ?? 0,
    placa: normalizePlaca(typeof raw.placa === "string" ? raw.placa : ""),
    modelo: toText(raw.modelo),
    cor: toText(raw.cor),
    categoria: toNumber(raw.categoria) ?? 0,
    dataEntrada: typeof raw.dataEntrada === "string" ? raw.dataEntrada : "",
    mensalista: raw.mensalista === true,
    conveniado: raw.conveniado === true,
    situacao: toNumber(raw.situacao) ?? 0,
    origem: toNumber(raw.origem),
    dataConferido: toText(raw.dataConferido),
    usuarioIdConferido: toNumber(raw.usuarioIdConferido),
    usuarioConferido: toText(raw.usuarioConferido),
    chave: fromChave(raw.chave),
  };
}

export function fromSemEntradaResponse(raw: Raw): SemEntrada | null {
  const placa = normalizePlaca(typeof raw.placa === "string" ? raw.placa : "");
  if (placa === "") {
    return null;
  }
  return {
    patioConferenciaSemEntradaId: toNumber(raw.patioConferenciaSemEntradaId) ?? 0,
    placa,
    dataLeitura: typeof raw.dataLeitura === "string" ? raw.dataLeitura : "",
    situacao: toNumber(raw.situacao) ?? 0,
    patioId: toNumber(raw.patioId),
  };
}

function fromAjusteResponse(raw: Raw): AjusteConferencia {
  return {
    tipo: toNumber(raw.tipo) ?? 0,
    placa: toText(raw.placa) === null ? null : normalizePlaca(String(raw.placa)),
    motivo: toNumber(raw.motivo),
    descricao: typeof raw.descricao === "string" ? raw.descricao : "",
  };
}

function comoLista<T>(valores: Raw[], converter: (raw: Raw) => T | null): T[] {
  return valores.map(converter).filter((valor): valor is T => valor !== null);
}

// GET /aberta, GET /{id}, POST / e POST /{id}/finalizar. O `totais` do servidor não é guardado: a tela calcula os seus.
export function fromConferenciaResponse(raw: Raw): Conferencia {
  return {
    patioConferenciaId: toNumber(raw.patioConferenciaId) ?? 0,
    caixaId: toNumber(raw.caixaId) ?? 0,
    metodo: toNumber(raw.metodo) ?? 0,
    situacao: toNumber(raw.situacao) ?? 0,
    dataInicio: typeof raw.dataInicio === "string" ? raw.dataInicio : "",
    usuarioIdInicio: toNumber(raw.usuarioIdInicio),
    usuarioInicio: toText(raw.usuarioInicio),
    dataFim: toText(raw.dataFim),
    usuarioIdFim: toNumber(raw.usuarioIdFim),
    usuarioFim: toText(raw.usuarioFim),
    observacao: toText(raw.observacao),
    itens: comoLista(records(raw.itens), fromItemResponse),
    semEntrada: comoLista(records(raw.semEntrada), fromSemEntradaResponse),
    ajustes: records(raw.ajustes).map(fromAjusteResponse),
  };
}

export function fromLeituraResponse(raw: Raw): ResultadoLeitura {
  return {
    resultado: toNumber(raw.resultado) ?? 0,
    placa: normalizePlaca(typeof raw.placa === "string" ? raw.placa : ""),
    item: isRecord(raw.item) ? fromItemResponse(raw.item) : null,
    semEntrada: isRecord(raw.semEntrada) ? fromSemEntradaResponse(raw.semEntrada) : null,
  };
}

function fromEncerrada(value: unknown): ConferenciaEncerrada | null {
  if (!isRecord(value)) {
    return null;
  }
  const id = toNumber(value.patioConferenciaId);
  if (id === null) {
    return null;
  }
  return {
    patioConferenciaId: id,
    caixaId: toNumber(value.caixaId) ?? 0,
    situacao: toNumber(value.situacao) ?? 0,
    dataFim: typeof value.dataFim === "string" ? value.dataFim : "",
    usuarioIdFim: toNumber(value.usuarioIdFim),
    usuarioFim: toText(value.usuarioFim),
    totalVeiculos: toNumber(value.totalVeiculos) ?? 0,
    totalConferidos: toNumber(value.totalConferidos) ?? 0,
  };
}

function fromEmAndamento(value: unknown): ConferenciaEmAndamento | null {
  if (!isRecord(value)) {
    return null;
  }
  const id = toNumber(value.patioConferenciaId);
  if (id === null) {
    return null;
  }
  return {
    patioConferenciaId: id,
    caixaId: toNumber(value.caixaId) ?? 0,
    dataInicio: typeof value.dataInicio === "string" ? value.dataInicio : "",
    usuarioIdInicio: toNumber(value.usuarioIdInicio),
    usuarioInicio: toText(value.usuarioInicio),
    total: toNumber(value.total) ?? 0,
    conferidos: toNumber(value.conferidos) ?? 0,
  };
}

export function fromResumoResponse(raw: Raw): ConferenciaResumo {
  return {
    totalVeiculos: toNumber(raw.totalVeiculos) ?? 0,
    avulsos: toNumber(raw.avulsos) ?? 0,
    mensais: toNumber(raw.mensais) ?? 0,
    conveniados: toNumber(raw.conveniados) ?? 0,
    caixaIdAberto: toNumber(raw.caixaIdAberto),
    ultimaConferencia: fromEncerrada(raw.ultimaConferencia),
    conferenciaAberta: fromEmAndamento(raw.conferenciaAberta),
  };
}
