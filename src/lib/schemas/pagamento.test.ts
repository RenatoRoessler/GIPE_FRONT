import { describe, expect, it } from "vitest";
import { FORMA_PAGAMENTO_OBRIGATORIA, pagamentoSchema, VALOR_PAGO_INVALIDO } from "./pagamento";

const valido = { valorPago: "280,00", formaPagamento: "2" };

function mensagens(values: Record<string, string>) {
  const result = pagamentoSchema.safeParse(values);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe("pagamentoSchema", () => {
  it("aceita um pagamento válido", () => {
    expect(pagamentoSchema.safeParse(valido).success).toBe(true);
  });

  it.each(["280", "280,5", "1.234,56", "R$ 280,00", "0,01", "280.50"])("aceita o valor %s", (valorPago) => {
    expect(pagamentoSchema.safeParse({ ...valido, valorPago }).success).toBe(true);
  });

  it.each(["", "   ", "0", "0,00", "-5", "abc", "280,555", "10.001"])("recusa o valor %j", (valorPago) => {
    expect(mensagens({ ...valido, valorPago })).toEqual([VALOR_PAGO_INVALIDO]);
  });

  it.each(["", "7", "0", "x"])("recusa a forma %j", (formaPagamento) => {
    expect(mensagens({ ...valido, formaPagamento })).toEqual([FORMA_PAGAMENTO_OBRIGATORIA]);
  });

  it.each(["1", "2", "3", "4", "5", "6"])("aceita a forma %s", (formaPagamento) => {
    expect(pagamentoSchema.safeParse({ ...valido, formaPagamento }).success).toBe(true);
  });
});
