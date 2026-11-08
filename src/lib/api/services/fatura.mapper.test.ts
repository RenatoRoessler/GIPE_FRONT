import { describe, expect, it } from "vitest";
import {
  fromFaturaDetalheResponse,
  fromFaturaItemResponse,
  fromFaturaResponse,
  toEmitirPayload,
  toPagarPayload,
} from "./fatura.mapper";

const faturaDto = {
  convenioFaturaId: 1,
  convenioFaturaGuid: "d796a912-b584-4b3a-9b19-fc9fcdd404f8",
  empresaId: 52,
  estacionamento: "empresa teste",
  empresaConveniadaId: 53,
  conveniada: "empresa conveniada 1",
  quantidadeSaidas: 1,
  valorTotal: 1.5,
  vencimento: "2026-12-08T00:00:00",
  situacao: 1,
  observacao: "teste",
  usuarioId: 47,
  usuario: "Renato Rossler",
  dataCriacao: "2026-11-08T10:46:56.797998",
  dataPagamento: null,
  formaPagamento: null,
  valorPago: null,
  usuarioPagamento: null,
  dataCancelamento: null,
  usuarioCancelamento: null,
};

const itemDto = {
  patioConvenioId: 17,
  placa: "YCC3U07",
  modelo: "FUSION",
  categoria: 3,
  dataEntrada: "2026-11-08T10:42:39.016539",
  dataSaida: "2026-11-08T10:46:43.199059",
  minutosPermanencia: 4,
  rotatividadeId: 23,
  rotatividade: "tabela convenio",
  percentualConveniada: 50,
  valorFixoConveniada: null,
  valorTotal: 3,
  valorConveniada: 1.5,
  valorCliente: 1.5,
  dataValidacao: "2026-11-08T10:43:48.28227",
  usuarioConveniada: "usuario conveniado 1",
};

describe("fromFaturaResponse", () => {
  it("lê a fatura, cortando o vencimento em AAAA-MM-DD e deixando nulo o que não veio", () => {
    expect(fromFaturaResponse(faturaDto)).toEqual({
      convenioFaturaId: 1,
      empresaConveniadaId: 53,
      conveniada: "empresa conveniada 1",
      quantidadeSaidas: 1,
      valorTotal: 1.5,
      vencimento: "2026-12-08",
      situacao: 1,
      observacao: "teste",
      usuario: "Renato Rossler",
      dataCriacao: "2026-11-08T10:46:56.797998",
      dataPagamento: null,
      formaPagamento: null,
      valorPago: null,
      usuarioPagamento: null,
      dataCancelamento: null,
      usuarioCancelamento: null,
    });
  });

  it("lê pagamento e cancelamento quando existem", () => {
    const paga = fromFaturaResponse({ ...faturaDto, situacao: 2, dataPagamento: "2026-11-12T09:00:00", formaPagamento: 2, valorPago: 1.2, usuarioPagamento: "Ana" });
    expect(paga).toMatchObject({ situacao: 2, dataPagamento: "2026-11-12T09:00:00", formaPagamento: 2, valorPago: 1.2, usuarioPagamento: "Ana" });

    const cancelada = fromFaturaResponse({ ...faturaDto, situacao: 3, dataCancelamento: "2026-11-13T09:00:00", usuarioCancelamento: "Beto" });
    expect(cancelada).toMatchObject({ situacao: 3, dataCancelamento: "2026-11-13T09:00:00", usuarioCancelamento: "Beto" });
  });

  it("campos ausentes ou fora do formato viram valores seguros, nunca NaN", () => {
    const fatura = fromFaturaResponse({ valorTotal: "abc", quantidadeSaidas: undefined });

    expect(fatura.valorTotal).toBe(0);
    expect(fatura.quantidadeSaidas).toBe(0);
    expect(fatura.conveniada).toBe("");
    expect(fatura.vencimento).toBe("");
    expect(fatura.observacao).toBeNull();
    expect(fromFaturaResponse(null).convenioFaturaId).toBe(0);
  });
});

describe("fromFaturaItemResponse", () => {
  it("lê a saída com a regra da conveniada e os valores", () => {
    expect(fromFaturaItemResponse(itemDto)).toEqual({
      patioConvenioId: 17,
      placa: "YCC3U07",
      modelo: "FUSION",
      categoria: 3,
      dataEntrada: "2026-11-08T10:42:39.016539",
      dataSaida: "2026-11-08T10:46:43.199059",
      minutosPermanencia: 4,
      rotatividade: "tabela convenio",
      percentualConveniada: 50,
      valorFixoConveniada: null,
      valorTotal: 3,
      valorConveniada: 1.5,
      valorCliente: 1.5,
    });
  });

  it("regra por valor fixo", () => {
    expect(fromFaturaItemResponse({ ...itemDto, percentualConveniada: null, valorFixoConveniada: 12 })).toMatchObject({
      percentualConveniada: null,
      valorFixoConveniada: 12,
    });
  });
});

describe("fromFaturaDetalheResponse", () => {
  it("junta a fatura e as saídas", () => {
    const detalhe = fromFaturaDetalheResponse({ fatura: faturaDto, itens: [itemDto] });

    expect(detalhe.fatura.convenioFaturaId).toBe(1);
    expect(detalhe.itens).toHaveLength(1);
    expect(detalhe.itens[0].placa).toBe("YCC3U07");
  });

  it("sem itens (cancelamento) devolve lista vazia", () => {
    expect(fromFaturaDetalheResponse({ fatura: faturaDto }).itens).toEqual([]);
    expect(fromFaturaDetalheResponse({ fatura: faturaDto, itens: [] }).itens).toEqual([]);
  });
});

describe("toEmitirPayload", () => {
  it("envia conveniada, vencimento e a observação sem espaços nas pontas", () => {
    expect(toEmitirPayload({ empresaConveniadaId: "53", vencimento: "2026-12-08", observacao: "  teste " })).toEqual({
      empresaConveniadaId: 53,
      vencimento: "2026-12-08",
      observacao: "teste",
    });
  });

  it("observação vazia não vai no corpo", () => {
    expect(toEmitirPayload({ empresaConveniadaId: "53", vencimento: "2026-12-08", observacao: "   " })).toEqual({
      empresaConveniadaId: 53,
      vencimento: "2026-12-08",
    });
  });
});

describe("toPagarPayload", () => {
  const hoje = "2026-11-08";

  it("só a forma de pagamento: sem valor pago nem data, vale o total e agora", () => {
    expect(toPagarPayload({ formaPagamento: "2", valorPago: "", dataPagamento: "" }, hoje)).toEqual({ formaPagamento: 2 });
  });

  it("valor pago em reais e data anterior a hoje vão no corpo", () => {
    expect(toPagarPayload({ formaPagamento: "1", valorPago: "R$ 1.234,50", dataPagamento: "2026-11-05" }, hoje)).toEqual({
      formaPagamento: 1,
      valorPago: 1234.5,
      dataPagamento: "2026-11-05",
    });
  });

  it("valor digitado só com dígitos, que a máscara mostra com ponto de milhar, não perde os zeros", () => {
    expect(toPagarPayload({ formaPagamento: "1", valorPago: "R$ 1.250", dataPagamento: "" }, hoje)).toEqual({ formaPagamento: 1, valorPago: 1250 });
  });

  it("a data de hoje não vai: o back grava agora", () => {
    expect(toPagarPayload({ formaPagamento: "1", valorPago: "", dataPagamento: hoje }, hoje)).toEqual({ formaPagamento: 1 });
  });
});
