import { describe, expect, it } from "vitest";
import {
  CONVENIADA_OBRIGATORIA,
  createEmitirFaturaSchema,
  createPagarFaturaSchema,
  DATA_PAGAMENTO_FUTURA,
  FORMA_OBRIGATORIA,
  OBSERVACAO_LONGA,
  VALOR_PAGO_INVALIDO,
  VENCIMENTO_OBRIGATORIO,
  VENCIMENTO_PASSADO,
} from "./fatura";

const hoje = "2026-11-08";

function mensagens(resultado: { success: boolean; error?: { issues: { message: string }[] } }) {
  return resultado.error?.issues.map((issue) => issue.message) ?? [];
}

describe("createEmitirFaturaSchema", () => {
  const schema = createEmitirFaturaSchema({ hoje });
  const valido = { empresaConveniadaId: "53", vencimento: "2026-12-08", observacao: "" };

  it("aceita conveniada, vencimento futuro e observação vazia", () => {
    expect(schema.safeParse(valido).success).toBe(true);
  });

  it("aceita vencimento hoje e observação de 500 caracteres", () => {
    expect(schema.safeParse({ ...valido, vencimento: hoje, observacao: "a".repeat(500) }).success).toBe(true);
  });

  it("exige a conveniada", () => {
    expect(mensagens(schema.safeParse({ ...valido, empresaConveniadaId: "" }))).toEqual([CONVENIADA_OBRIGATORIA]);
  });

  it("exige o vencimento", () => {
    expect(mensagens(schema.safeParse({ ...valido, vencimento: "" }))).toEqual([VENCIMENTO_OBRIGATORIO]);
  });

  it("recusa vencimento anterior a hoje", () => {
    expect(mensagens(schema.safeParse({ ...valido, vencimento: "2026-11-07" }))).toEqual([VENCIMENTO_PASSADO]);
  });

  it("recusa observação com 501 caracteres", () => {
    expect(mensagens(schema.safeParse({ ...valido, observacao: "a".repeat(501) }))).toEqual([OBSERVACAO_LONGA]);
  });
});

describe("createPagarFaturaSchema", () => {
  const schema = createPagarFaturaSchema({ hoje });
  const valido = { formaPagamento: "2", valorPago: "", dataPagamento: "" };

  it("aceita só a forma de pagamento", () => {
    expect(schema.safeParse(valido).success).toBe(true);
  });

  it("aceita o valor com ponto de milhar da máscara, sem vírgula", () => {
    expect(schema.safeParse({ ...valido, valorPago: "R$ 1.250" }).success).toBe(true);
  });

  it("aceita valor em reais e data de hoje ou anterior", () => {
    expect(schema.safeParse({ ...valido, valorPago: "R$ 1.234,50", dataPagamento: hoje }).success).toBe(true);
    expect(schema.safeParse({ ...valido, dataPagamento: "2026-11-01" }).success).toBe(true);
  });

  it("exige uma forma de pagamento conhecida", () => {
    expect(mensagens(schema.safeParse({ ...valido, formaPagamento: "" }))).toEqual([FORMA_OBRIGATORIA]);
    expect(mensagens(schema.safeParse({ ...valido, formaPagamento: "99" }))).toEqual([FORMA_OBRIGATORIA]);
  });

  it("recusa valor pago zero, negativo ou com três casas", () => {
    for (const valorPago of ["0", "0,00", "-5", "1,234"]) {
      expect(mensagens(schema.safeParse({ ...valido, valorPago }))).toEqual([VALOR_PAGO_INVALIDO]);
    }
  });

  it("recusa data de pagamento futura", () => {
    expect(mensagens(schema.safeParse({ ...valido, dataPagamento: "2026-11-09" }))).toEqual([DATA_PAGAMENTO_FUTURA]);
  });
});
