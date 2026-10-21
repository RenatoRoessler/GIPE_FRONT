import { formatDocumento, normalizeDocumento } from "@/lib/documento";
import { parseMoney } from "@/lib/money";
import { formatCPF } from "@/lib/cpf";
import { formatPhone } from "@/lib/phone";
import { normalizePlaca } from "@/lib/placa";
import { newUid } from "@/lib/uid";
import type { SessaoIds } from "@/lib/session";
import type { FormaPagamentoId } from "@/types/caixa";
import type { TipoCategoria } from "@/types/preco";
import { matchCor } from "@/types/veiculo";
import {
  ORIGEM_PAGAMENTO,
  TIPO_PESSOA,
  type CobrancaMensalista,
  type Condutor,
  type CondutorFormValues,
  type Mensalista,
  type MensalistaFormValues,
  type MensalistaPayload,
  type MensalistaTipo,
  type MensalistaTipoPayload,
  type MensalistaVeiculo,
  type MensalistaVeiculoPayload,
  type PagamentoMensalistaPayload,
  type PagamentoMensalistaResultado,
  type TipoFormValues,
  type TipoPessoa,
  type VeiculoFormValues,
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

function fromCondutorResponse(dto: Partial<Condutor>): Condutor {
  return { nome: dto.nome ?? "", cpf: onlyDigits(dto.cpf ?? "") };
}

function fromVeiculoResponse(dto: Partial<MensalistaVeiculo>): MensalistaVeiculo {
  return {
    placa: normalizePlaca(dto.placa ?? ""),
    modelo: dto.modelo ?? "",
    cor: dto.cor ?? "",
    categoria: (dto.categoria ?? 1) as TipoCategoria,
    condutores: (dto.condutores ?? []).map(fromCondutorResponse),
  };
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
    veiculos: (dto.veiculos ?? []).map(fromVeiculoResponse),
    situacao: dto.situacao ?? null,
    dataProximoVencimento: dto.dataProximoVencimento ?? null,
    diasAteProximoVencimento: dto.diasAteProximoVencimento ?? null,
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

function toVeiculoPayload(veiculo: VeiculoFormValues, pessoa: TipoPessoa): MensalistaVeiculoPayload {
  const payload: MensalistaVeiculoPayload = {
    placa: normalizePlaca(veiculo.placa),
    modelo: veiculo.modelo.trim(),
    cor: veiculo.cor.trim(),
    categoria: Number(veiculo.categoria) as TipoCategoria,
  };
  // O back recusa condutores para pessoa física: a chave nem é enviada.
  if (pessoa === TIPO_PESSOA.Juridica) {
    payload.condutores = veiculo.condutores.map((condutor) => ({
      nome: condutor.nome.trim(),
      cpf: onlyDigits(condutor.cpf),
    }));
  }
  return payload;
}

export function toMensalistaPayload(values: MensalistaFormValues): MensalistaPayload {
  const pessoa = Number(values.tipoPessoa) as TipoPessoa;
  return {
    mensalistaTipoId: Number(values.mensalistaTipoId),
    tipoPessoa: pessoa,
    documento: normalizeDocumento(values.documento),
    nome: values.nome.trim(),
    email: values.email.trim(),
    celular: onlyDigits(values.celular),
    diaVencimento: Number(values.diaVencimento),
    ativo: values.ativo,
    veiculos: values.veiculos.map((veiculo) => toVeiculoPayload(veiculo, pessoa)),
  };
}

function fromCondutor(condutor: Condutor): CondutorFormValues {
  return { uid: newUid(), nome: condutor.nome, cpf: formatCPF(condutor.cpf) };
}

function fromVeiculo(veiculo: MensalistaVeiculo): VeiculoFormValues {
  return {
    uid: newUid(),
    placa: veiculo.placa,
    modelo: veiculo.modelo,
    // Cor que bate com uma amostra vira o valor dela; as demais seguem como o cliente digitou.
    cor: matchCor(veiculo.cor) ?? veiculo.cor,
    categoria: String(veiculo.categoria),
    condutores: veiculo.condutores.map(fromCondutor),
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
    veiculos: mensalista.veiculos.map(fromVeiculo),
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

// [A CONFIRMAR] Nomes dos campos da resposta de POST /Mensalista/pagamento. Reduzir quando o formato real for conferido.
const COBRANCA_PAGA_KEYS = ["cobrancaPaga", "paga", "pagamento"] as const;
const COBRANCA_PROXIMA_KEYS = ["proximaCobranca", "proxima"] as const;

function pick(raw: Record<string, unknown>, keys: readonly string[]): unknown {
  for (const key of keys) {
    if (raw[key] !== undefined && raw[key] !== null) {
      return raw[key];
    }
  }
  return undefined;
}

function numberOrNull(value: unknown): number | null {
  const number = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  return typeof number === "number" && Number.isFinite(number) ? number : null;
}

function textOrNull(value: unknown): string | null {
  return typeof value === "string" && value ? value : null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function toCobranca(value: unknown): CobrancaMensalista | null {
  const raw = asRecord(value);
  if (!raw) {
    return null;
  }
  return {
    cobrancaId: numberOrNull(pick(raw, ["cobrancaId", "id"])),
    valor: numberOrNull(pick(raw, ["valor", "valorCobranca", "valorPago"])) ?? 0,
    vencimento: textOrNull(pick(raw, ["dataVencimento", "vencimento"])),
    dataPagamento: textOrNull(pick(raw, ["dataPagamento", "dataBaixa"])),
    formaPagamento: numberOrNull(raw.formaPagamento),
    status: numberOrNull(raw.status),
  };
}

export function toPagamentoPayload(
  values: { mensalistaId: number; valorPago: number; formaPagamento: FormaPagamentoId },
  sessao: SessaoIds,
): PagamentoMensalistaPayload {
  return {
    mensalistaId: values.mensalistaId,
    valorPago: Math.round(values.valorPago * 100) / 100,
    formaPagamento: values.formaPagamento,
    origemPagamento: ORIGEM_PAGAMENTO.PainelAdministrativo,
    usuarioId: sessao.usuarioId,
  };
}

// Tolerante: sem a cobrança paga na resposta, a baixa é descrita pelo que foi enviado (`fallback`).
export function fromPagamentoResponse(data: unknown, fallback: CobrancaMensalista): PagamentoMensalistaResultado {
  const raw = asRecord(data) ?? {};
  const paga = toCobranca(pick(raw, COBRANCA_PAGA_KEYS));
  const proxima = toCobranca(pick(raw, COBRANCA_PROXIMA_KEYS));
  return {
    paga: paga
      ? {
          ...paga,
          valor: paga.valor || fallback.valor,
          formaPagamento: paga.formaPagamento ?? fallback.formaPagamento,
          dataPagamento: paga.dataPagamento ?? fallback.dataPagamento,
        }
      : fallback,
    proxima,
  };
}
