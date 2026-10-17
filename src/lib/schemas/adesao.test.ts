import { describe, expect, it } from "vitest";
import { zodFieldErrors } from "@/components/form/zodFieldErrors";
import { EMPTY_PAYMENTS_DATA, MEIOS_PAGAMENTO, type PaymentsData } from "@/types/adesao";
import { PAGAMENTOS_MINIMO_MESSAGE, paymentsSchema } from "./adesao";

const NENHUM: PaymentsData = { dinheiro: false, pix: false, cartaoCredito: false, cartaoDebito: false };

describe("MEIOS_PAGAMENTO e padrão da adesão", () => {
  it("lista os quatro meios na ordem de exibição", () => {
    expect(MEIOS_PAGAMENTO.map((meio) => meio.key)).toEqual(["dinheiro", "pix", "cartaoCredito", "cartaoDebito"]);
    expect(MEIOS_PAGAMENTO.map((meio) => meio.curto)).toEqual(["Dinheiro", "Pix", "Crédito", "Débito"]);
  });

  it("começa só com dinheiro ligado", () => {
    expect(EMPTY_PAYMENTS_DATA).toEqual({ dinheiro: true, pix: false, cartaoCredito: false, cartaoDebito: false });
    expect(paymentsSchema.safeParse(EMPTY_PAYMENTS_DATA).success).toBe(true);
  });
});

describe("paymentsSchema", () => {
  it.each(MEIOS_PAGAMENTO.map((meio) => meio.key))("aceita só %s ligado", (key) => {
    expect(paymentsSchema.safeParse({ ...NENHUM, [key]: true }).success).toBe(true);
  });

  it("aceita todos ligados", () => {
    expect(
      paymentsSchema.safeParse({ dinheiro: true, pix: true, cartaoCredito: true, cartaoDebito: true }).success,
    ).toBe(true);
  });

  it("rejeita todos desligados com a mensagem no campo dinheiro", () => {
    const result = paymentsSchema.safeParse(NENHUM);
    expect(result.success).toBe(false);
    expect(result.error?.issues).toHaveLength(1);
    expect(result.error?.issues[0]).toMatchObject({ path: ["dinheiro"], message: PAGAMENTOS_MINIMO_MESSAGE });
  });

  it("gera o erro no formato dos campos do formulário", () => {
    const result = paymentsSchema.safeParse(NENHUM);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(zodFieldErrors(result)).toEqual({ fields: { dinheiro: PAGAMENTOS_MINIMO_MESSAGE } });
    }
  });

  it("rejeita valores que não são booleanos", () => {
    expect(paymentsSchema.safeParse({ ...NENHUM, pix: "sim" }).success).toBe(false);
  });
});
