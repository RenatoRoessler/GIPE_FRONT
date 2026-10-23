import { describe, expect, it } from "vitest";
import { classificarMovimento, fromCaixaFechadoResponse, fromMovimentoResponse } from "./caixa.mapper";

describe("classificarMovimento", () => {
  it("sangria vem pelo texto do tipo ou da origem, com ou sem acento", () => {
    expect(classificarMovimento({ tipoDescricao: "Saída", origemDescricao: "Sangria" })).toBe("sangria");
    expect(classificarMovimento({ origem: "SANGRIA" })).toBe("sangria");
  });

  it("saída e estorno são saídas", () => {
    expect(classificarMovimento({ tipo: "Saída" })).toBe("saida");
    expect(classificarMovimento({ tipoDescricao: "Estorno" })).toBe("saida");
  });

  it("entrada pelo texto", () => {
    expect(classificarMovimento({ tipoDescricao: "Entrada", origemDescricao: "Pátio" })).toBe("entrada");
  });

  it("código numérico: 1 entrada, 2 saída", () => {
    expect(classificarMovimento({ tipo: 1 })).toBe("entrada");
    expect(classificarMovimento({ tipo: 2 })).toBe("saida");
  });

  it("sem tipo, o sinal do valor decide", () => {
    expect(classificarMovimento({ valor: -10 })).toBe("saida");
    expect(classificarMovimento({ valor: 10 })).toBe("entrada");
    expect(classificarMovimento({})).toBe("entrada");
  });
});

describe("movimentos como a API real devolve (23/10/2026)", () => {
  const entradaDoPatio = { id: 25, turnoId: 3, usuarioId: 26, usuario: "renato teste", tipo: 1, origem: 1, valor: 20.0, formaPagamento: 1, patioId: 58, dataHora: "2026-10-23T18:11:59.24843", observacao: null };
  const sangria = { id: 26, turnoId: 3, usuarioId: 26, usuario: "renato teste", tipo: 2, origem: 2, valor: 1.0, formaPagamento: 1, patioId: null, dataHora: "2026-10-23T18:24:32.64564", observacao: "Teste de validação" };

  it("tipo 1 e origem 1 é entrada do pátio", () => {
    expect(fromMovimentoResponse(entradaDoPatio)).toEqual({
      movimentoId: 25,
      dataHora: "2026-10-23T18:11:59.24843",
      tipo: "entrada",
      valor: 20,
      formaPagamento: 1,
      turnoId: 3,
      usuario: "renato teste",
      motivo: null,
    });
  });

  it("tipo 2 e origem 2 é sangria, com o motivo vindo de observacao", () => {
    expect(fromMovimentoResponse(sangria)).toMatchObject({ movimentoId: 26, tipo: "sangria", valor: 1, motivo: "Teste de validação" });
  });

  it("tipo 2 com outra origem é saída comum", () => {
    expect(fromMovimentoResponse({ ...sangria, origem: 3 }).tipo).toBe("saida");
  });

  it("a origem numérica 2 ganha do tipo", () => {
    expect(classificarMovimento({ tipo: 1, origem: 2 })).toBe("sangria");
  });
});

describe("fromMovimentoResponse", () => {
  it("normaliza nomes alternativos, valor absoluto e nulos", () => {
    expect(
      fromMovimentoResponse({
        caixaMovimentoId: 9,
        dataHoraMovimento: "2026-10-23T09:15:00",
        tipoDescricao: "Saída",
        origemDescricao: "Sangria",
        valor: -80,
        formaPagamento: 1,
        turnoId: 4,
        nomeUsuario: "Maria",
        observacao: "Cofre",
      }),
    ).toEqual({
      movimentoId: 9,
      dataHora: "2026-10-23T09:15:00",
      tipo: "sangria",
      valor: 80,
      formaPagamento: 1,
      turnoId: 4,
      usuario: "Maria",
      motivo: "Cofre",
    });
  });

  it("campos ausentes viram valores seguros", () => {
    expect(fromMovimentoResponse({})).toEqual({
      movimentoId: 0,
      dataHora: "",
      tipo: "entrada",
      valor: 0,
      formaPagamento: null,
      turnoId: null,
      usuario: "",
      motivo: null,
    });
  });
});

describe("fromCaixaFechadoResponse", () => {
  it("junta quem abriu e quem fechou e mantém os totais", () => {
    const caixa = fromCaixaFechadoResponse({
      caixaId: 12,
      dataHoraAbertura: "2026-10-12T08:00:00",
      dataHoraFechamento: "2026-10-12T18:30:00",
      valorFundoCaixa: 100,
      valorTotalEntrada: 900,
      valorTotalSaida: 200,
      usuarioAbertura: "Ana",
      usuarioFechamento: "Beto",
    });
    expect(caixa).toMatchObject({
      caixaId: 12,
      abriu: "Ana",
      fechou: "Beto",
      valorTotalEntrada: 900,
      valorTotalSaida: 200,
      dataHoraFechamento: "2026-10-12T18:30:00",
    });
    expect(caixa).not.toHaveProperty("usuarioAbertura");
  });

  it("aceita abriu e fechou direto e tolera ausências", () => {
    expect(fromCaixaFechadoResponse({ caixaId: 1, abriu: "A", fechou: "B" })).toMatchObject({ abriu: "A", fechou: "B", valorFundoCaixa: 0, valorTotalEntrada: null });
    expect(fromCaixaFechadoResponse({ caixaId: 1 })).toMatchObject({ abriu: "", fechou: "" });
  });
});
