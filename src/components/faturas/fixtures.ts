import { SITUACAO_FATURA, type Fatura, type FaturaDetalhe, type FaturaItem } from "@/types/fatura";

// Dados de teste dos componentes de Faturas.
export function fatura(extra: Partial<Fatura> = {}): Fatura {
  return {
    convenioFaturaId: 12,
    empresaConveniadaId: 53,
    conveniada: "Auto Peças Sul",
    quantidadeSaidas: 2,
    valorTotal: 1250,
    vencimento: "2026-12-08",
    situacao: SITUACAO_FATURA.Aberta,
    observacao: null,
    usuario: "Renato Rossler",
    dataCriacao: "2026-11-08T10:46:56.797998",
    dataPagamento: null,
    formaPagamento: null,
    valorPago: null,
    usuarioPagamento: null,
    dataCancelamento: null,
    usuarioCancelamento: null,
    ...extra,
  };
}

export function item(extra: Partial<FaturaItem> = {}): FaturaItem {
  return {
    patioConvenioId: 17,
    placa: "YCC3U07",
    modelo: "FUSION",
    categoria: 3,
    dataEntrada: "2026-11-07T08:10:00",
    dataSaida: "2026-11-07T17:40:00",
    minutosPermanencia: 570,
    rotatividade: "Tabela convênio",
    percentualConveniada: 50,
    valorFixoConveniada: null,
    valorTotal: 30,
    valorConveniada: 15,
    valorCliente: 15,
    ...extra,
  };
}

export function detalhe(faturaExtra: Partial<Fatura> = {}, itens: FaturaItem[] = [item(), item({ patioConvenioId: 18, placa: "ABC1D23", modelo: null, valorConveniada: 1235, valorTotal: 2470, valorCliente: 1235 })]): FaturaDetalhe {
  return { fatura: fatura(faturaExtra), itens };
}
