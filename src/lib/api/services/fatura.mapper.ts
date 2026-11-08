import { parseMaskedMoney } from "@/lib/money";
import type {
  EmitirFaturaPayload,
  EmitirFaturaValues,
  Fatura,
  FaturaDetalhe,
  FaturaItem,
  PagarFaturaPayload,
  PagarFaturaValues,
} from "@/types/fatura";
import { toNumber, toText } from "./mapperUtils";

type Dto = Record<string, unknown>;

function dto(valor: unknown): Dto {
  return valor && typeof valor === "object" ? (valor as Dto) : {};
}

// Campo ausente ou fora do formato nunca vira NaN na tela.
function numero(valor: unknown): number {
  return toNumber(valor) ?? 0;
}

// "2026-12-08T00:00:00" vira "2026-12-08".
function dia(valor: unknown): string {
  return typeof valor === "string" ? valor.slice(0, 10) : "";
}

export function fromFaturaResponse(valor: unknown): Fatura {
  const d = dto(valor);
  return {
    convenioFaturaId: numero(d.convenioFaturaId),
    empresaConveniadaId: numero(d.empresaConveniadaId),
    conveniada: toText(d.conveniada) ?? "",
    quantidadeSaidas: numero(d.quantidadeSaidas),
    valorTotal: numero(d.valorTotal),
    vencimento: dia(d.vencimento),
    situacao: numero(d.situacao),
    observacao: toText(d.observacao),
    usuario: toText(d.usuario),
    dataCriacao: toText(d.dataCriacao) ?? "",
    dataPagamento: toText(d.dataPagamento),
    formaPagamento: toNumber(d.formaPagamento),
    valorPago: toNumber(d.valorPago),
    usuarioPagamento: toText(d.usuarioPagamento),
    dataCancelamento: toText(d.dataCancelamento),
    usuarioCancelamento: toText(d.usuarioCancelamento),
  };
}

export function fromFaturaItemResponse(valor: unknown): FaturaItem {
  const d = dto(valor);
  return {
    patioConvenioId: numero(d.patioConvenioId),
    placa: toText(d.placa) ?? "",
    modelo: toText(d.modelo),
    categoria: numero(d.categoria),
    dataEntrada: toText(d.dataEntrada) ?? "",
    dataSaida: toText(d.dataSaida) ?? "",
    minutosPermanencia: numero(d.minutosPermanencia),
    rotatividade: toText(d.rotatividade),
    percentualConveniada: toNumber(d.percentualConveniada),
    valorFixoConveniada: toNumber(d.valorFixoConveniada),
    valorTotal: numero(d.valorTotal),
    valorConveniada: numero(d.valorConveniada),
    valorCliente: numero(d.valorCliente),
  };
}

export function fromFaturaDetalheResponse(valor: unknown): FaturaDetalhe {
  const d = dto(valor);
  return {
    fatura: fromFaturaResponse(d.fatura),
    itens: Array.isArray(d.itens) ? d.itens.map(fromFaturaItemResponse) : [],
  };
}

// Observação vazia não vai no corpo.
export function toEmitirPayload(values: EmitirFaturaValues): EmitirFaturaPayload {
  const observacao = values.observacao.trim();
  return {
    empresaConveniadaId: Number(values.empresaConveniadaId),
    vencimento: values.vencimento,
    ...(observacao ? { observacao } : {}),
  };
}

// Valor pago vazio vale o total. A data de hoje também não vai: sem data o back grava "agora", e com ela, meia-noite.
export function toPagarPayload(values: PagarFaturaValues, hoje: string): PagarFaturaPayload {
  const valorPago = values.valorPago.trim() ? parseMaskedMoney(values.valorPago) : null;
  const dataPagamento = values.dataPagamento && values.dataPagamento !== hoje ? values.dataPagamento : null;
  return {
    formaPagamento: Number(values.formaPagamento),
    ...(valorPago !== null ? { valorPago } : {}),
    ...(dataPagamento ? { dataPagamento } : {}),
  };
}
