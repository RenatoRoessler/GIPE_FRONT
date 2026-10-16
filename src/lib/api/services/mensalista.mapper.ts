import { formatDocumento, normalizeDocumento } from "@/lib/documento";
import { parseMoney } from "@/lib/money";
import { formatPhone } from "@/lib/phone";
import type { TipoCategoria } from "@/types/preco";
import {
  TIPO_PESSOA,
  type Mensalista,
  type MensalistaFormValues,
  type MensalistaPayload,
  type MensalistaTipo,
  type MensalistaTipoPayload,
  type TipoFormValues,
  type TipoPessoa,
} from "@/types/mensalista";

const onlyDigits = (value: string) => value.replace(/\D/g, "");

// [A CONFIRMAR] O contrato não diz se o horário vem como "HH:mm" ou "HH:mm:ss"; a leitura aceita os dois
// e o envio usa "HH:mm".
function toHorario(value: string): string | null {
  const text = value.trim();
  return text === "" ? null : text.slice(0, 5);
}

function fromHorario(value: string | null | undefined): string {
  return value ? value.slice(0, 5) : "";
}

function formatValorInput(value: number): string {
  return value.toFixed(2).replace(".", ",");
}

// Respostas tolerantes: campos ausentes viram valores neutros em vez de quebrar a tela.
export function fromMensalistaResponse(dto: Partial<Mensalista>): Mensalista {
  return {
    mensalistaId: dto.mensalistaId ?? 0,
    mensalistaTipoId: dto.mensalistaTipoId ?? 0,
    tipoMensal: dto.tipoMensal ?? "",
    categoria: (dto.categoria ?? 99) as TipoCategoria,
    valorMensalidade: dto.valorMensalidade ?? 0,
    tipoPessoa: dto.tipoPessoa ?? TIPO_PESSOA.Fisica,
    documento: dto.documento ?? "",
    nome: dto.nome ?? "",
    email: dto.email ?? "",
    celular: dto.celular ?? "",
    diaVencimento: dto.diaVencimento ?? 1,
    ativo: dto.ativo ?? true,
    cadastradoPor: dto.cadastradoPor ?? null,
    alteradoPor: dto.alteradoPor ?? null,
  };
}

export function fromTipoResponse(dto: Partial<MensalistaTipo>): MensalistaTipo {
  return {
    mensalistaTipoId: dto.mensalistaTipoId ?? 0,
    tipoMensal: dto.tipoMensal ?? "",
    categoria: (dto.categoria ?? 99) as TipoCategoria,
    valorMensalidade: dto.valorMensalidade ?? 0,
    horarioEntrada: dto.horarioEntrada || null,
    horarioSaida: dto.horarioSaida || null,
    ativo: dto.ativo ?? true,
    criadoPor: dto.criadoPor ?? null,
    alteradoPor: dto.alteradoPor ?? null,
  };
}

export function toMensalistaPayload(values: MensalistaFormValues): MensalistaPayload {
  return {
    mensalistaTipoId: Number(values.mensalistaTipoId),
    tipoPessoa: Number(values.tipoPessoa) as TipoPessoa,
    documento: normalizeDocumento(values.documento),
    nome: values.nome.trim(),
    email: values.email.trim(),
    celular: onlyDigits(values.celular),
    diaVencimento: Number(values.diaVencimento),
    ativo: values.ativo,
  };
}

export function fromMensalista(mensalista: Mensalista): MensalistaFormValues {
  return {
    mensalistaTipoId: String(mensalista.mensalistaTipoId),
    tipoPessoa: String(mensalista.tipoPessoa),
    documento: formatDocumento(mensalista.documento, mensalista.tipoPessoa),
    nome: mensalista.nome,
    email: mensalista.email,
    celular: formatPhone(mensalista.celular),
    diaVencimento: String(mensalista.diaVencimento),
    ativo: mensalista.ativo,
  };
}

export function toTipoPayload(values: TipoFormValues): MensalistaTipoPayload {
  return {
    tipoMensal: values.tipoMensal.trim(),
    categoria: Number(values.categoria) as TipoCategoria,
    valorMensalidade: Math.round(parseMoney(values.valorMensalidade) * 100) / 100,
    horarioEntrada: toHorario(values.horarioEntrada),
    horarioSaida: toHorario(values.horarioSaida),
    ativo: values.ativo,
  };
}

export function fromTipo(tipo: MensalistaTipo): TipoFormValues {
  return {
    tipoMensal: tipo.tipoMensal,
    categoria: String(tipo.categoria),
    valorMensalidade: formatValorInput(tipo.valorMensalidade),
    horarioEntrada: fromHorario(tipo.horarioEntrada),
    horarioSaida: fromHorario(tipo.horarioSaida),
    ativo: tipo.ativo,
  };
}
