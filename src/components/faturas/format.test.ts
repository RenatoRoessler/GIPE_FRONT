import { describe, expect, it } from "vitest";
import { FORMA_PAGAMENTO } from "@/types/caixa";
import { SITUACAO_FATURA, type Fatura } from "@/types/fatura";
import { mensagemEmissao, numeroFatura, quantidadeSaidas, regraConveniada, resumoCiclo } from "./format";

function fatura(parcial: Partial<Fatura>): Fatura {
  return {
    convenioFaturaId: 12,
    empresaConveniadaId: 1,
    conveniada: "Auto Peças Sul",
    quantidadeSaidas: 14,
    valorTotal: 1250,
    vencimento: "2026-12-08",
    situacao: SITUACAO_FATURA.Aberta,
    observacao: null,
    usuario: "Renato R.",
    dataCriacao: "2026-11-08T09:00:00",
    dataPagamento: null,
    formaPagamento: null,
    valorPago: null,
    usuarioPagamento: null,
    dataCancelamento: null,
    usuarioCancelamento: null,
    ...parcial,
  };
}

describe("numeroFatura e quantidadeSaidas", () => {
  it("mostra o número com # e concorda o plural", () => {
    expect(numeroFatura({ convenioFaturaId: 12 })).toBe("#12");
    expect(quantidadeSaidas(1)).toBe("1 saída");
    expect(quantidadeSaidas(14)).toBe("14 saídas");
    expect(quantidadeSaidas(0)).toBe("0 saídas");
  });
});

describe("regraConveniada", () => {
  it("percentual", () => {
    expect(regraConveniada({ percentualConveniada: 50, valorFixoConveniada: null })).toBe("50%");
    expect(regraConveniada({ percentualConveniada: 12.5, valorFixoConveniada: null })).toBe("12,5%");
  });

  it("valor fixo", () => {
    expect(regraConveniada({ percentualConveniada: null, valorFixoConveniada: 12 })).toBe("R$ 12,00 fixo");
  });

  it("sem regra informada", () => {
    expect(regraConveniada({ percentualConveniada: null, valorFixoConveniada: null })).toBe("—");
  });
});

describe("mensagemEmissao", () => {
  it("diz quantas saídas e quanto", () => {
    expect(mensagemEmissao({ quantidadeSaidas: 14, valorTotal: 1250 })).toBe("Fatura emitida: 14 saídas, R$ 1.250,00.");
    expect(mensagemEmissao({ quantidadeSaidas: 1, valorTotal: 1.5 })).toBe("Fatura emitida: 1 saída, R$ 1,50.");
  });
});

describe("resumoCiclo", () => {
  it("resume a fatura aberta pela emissão", () => {
    expect(resumoCiclo(fatura({}))).toBe("Emitida em 08/11 por Renato R.");
  });

  it("pula quem emitiu quando o back não trouxe", () => {
    expect(resumoCiclo(fatura({ usuario: null }))).toBe("Emitida em 08/11");
  });

  it("resume a fatura paga com data, forma e valor", () => {
    const paga = fatura({ situacao: SITUACAO_FATURA.Paga, dataPagamento: "2026-11-12T10:30:00", formaPagamento: FORMA_PAGAMENTO.Pix });
    expect(resumoCiclo(paga)).toBe("Paga em 12/11 · Pix · R$ 1.250,00");
  });

  it("usa o valor pago quando é diferente do total", () => {
    const paga = fatura({ situacao: SITUACAO_FATURA.Paga, dataPagamento: "2026-11-12T10:30:00", formaPagamento: FORMA_PAGAMENTO.Pix, valorPago: 1200 });
    expect(resumoCiclo(paga)).toBe("Paga em 12/11 · Pix · R$ 1.200,00");
  });

  it("pula a forma de pagamento ausente", () => {
    const paga = fatura({ situacao: SITUACAO_FATURA.Paga, dataPagamento: "2026-11-12T10:30:00" });
    expect(resumoCiclo(paga)).toBe("Paga em 12/11 · R$ 1.250,00");
  });

  it("resume a fatura cancelada com data e quem cancelou", () => {
    const cancelada = fatura({ situacao: SITUACAO_FATURA.Cancelada, dataCancelamento: "2026-11-15T08:00:00", usuarioCancelamento: "Ana" });
    expect(resumoCiclo(cancelada)).toBe("Cancelada em 15/11 por Ana");
  });
});
