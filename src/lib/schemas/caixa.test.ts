import { describe, expect, it } from "vitest";
import { conferenciaSchema, createSangriaSchema, fundoCaixaSchema, periodoSchema, toConferencias } from "./caixa";

describe("fundoCaixaSchema", () => {
  it("exige o fundo e recusa valor inválido", () => {
    expect(fundoCaixaSchema.safeParse({ fundoCaixa: "" }).success).toBe(false);
    expect(fundoCaixaSchema.safeParse({ fundoCaixa: "abc" }).success).toBe(false);
    expect(fundoCaixaSchema.safeParse({ fundoCaixa: "0" }).success).toBe(true);
    expect(fundoCaixaSchema.safeParse({ fundoCaixa: "150,50" }).success).toBe(true);
  });
});

describe("createSangriaSchema", () => {
  const valido = { valor: "50,00", observacao: "Cofre" };

  it("aceita valor dentro do disponível", () => {
    expect(createSangriaSchema(100).safeParse(valido).success).toBe(true);
    expect(createSangriaSchema(50).safeParse(valido).success).toBe(true);
  });

  it("recusa valor acima do disponível sem falar em troco padrão", () => {
    const resultado = createSangriaSchema(30).safeParse(valido);
    expect(resultado.success).toBe(false);
    const mensagem = resultado.error?.issues.map((issue) => issue.message).join(" ") ?? "";
    expect(mensagem).toContain("O valor passa do que pode ser retirado (R$");
    expect(mensagem).toContain("O fundo de caixa fica na gaveta.");
    expect(mensagem.toLowerCase()).not.toContain("troco");
  });

  it("exige valor maior que zero e motivo", () => {
    expect(createSangriaSchema(100).safeParse({ valor: "0", observacao: "x" }).success).toBe(false);
    expect(createSangriaSchema(100).safeParse({ valor: "10", observacao: "  " }).success).toBe(false);
  });

  it("sem disponível conhecido não limita", () => {
    expect(createSangriaSchema(null).safeParse({ valor: "9999", observacao: "x" }).success).toBe(true);
  });
});

describe("conferenciaSchema", () => {
  it("aceita campos vazios (contam como zero) e fundo opcional", () => {
    expect(conferenciaSchema.safeParse({ conferencias: ["", "10,00"], fundoCaixa: "", observacao: "" }).success).toBe(true);
    expect(conferenciaSchema.safeParse({ conferencias: [""], fundoCaixa: "100", observacao: "" }).success).toBe(true);
  });

  it("recusa valor inválido na conferência e no fundo, inclusive negativo", () => {
    expect(conferenciaSchema.safeParse({ conferencias: ["x"], fundoCaixa: "", observacao: "" }).success).toBe(false);
    expect(conferenciaSchema.safeParse({ conferencias: [""], fundoCaixa: "-5", observacao: "" }).success).toBe(false);
  });
});

describe("toConferencias", () => {
  it("monta uma conferência por forma, com vazio e inválido valendo zero", () => {
    const formas = [
      { formaPagamento: 1, entradas: 0, saidas: 0, valorEsperado: 0, valorInformado: null, diferenca: null },
      { formaPagamento: 2, entradas: 0, saidas: 0, valorEsperado: 0, valorInformado: null, diferenca: null },
    ];
    expect(toConferencias(formas, ["12,50", ""])).toEqual([
      { formaPagamento: 1, valorInformado: 12.5 },
      { formaPagamento: 2, valorInformado: 0 },
    ]);
  });
});

describe("periodoSchema", () => {
  it("aceita período vazio, parcial ou em ordem", () => {
    expect(periodoSchema.safeParse({ dataInicio: "", dataFim: "" }).success).toBe(true);
    expect(periodoSchema.safeParse({ dataInicio: "2026-10-01", dataFim: "" }).success).toBe(true);
    expect(periodoSchema.safeParse({ dataInicio: "2026-10-01", dataFim: "2026-10-01" }).success).toBe(true);
  });

  it("recusa data inicial depois da final", () => {
    const resultado = periodoSchema.safeParse({ dataInicio: "2026-10-10", dataFim: "2026-10-01" });
    expect(resultado.success).toBe(false);
    expect(resultado.error?.issues[0].message).toBe("A data inicial não pode ser depois da final");
  });
});
