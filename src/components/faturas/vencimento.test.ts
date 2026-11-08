import { describe, expect, it } from "vitest";
import { SITUACAO_FATURA } from "@/types/fatura";
import { atalhoSelecionado, avisoVencimento, diasParaVencer, vencimentoEm } from "./vencimento";

const HOJE = "2026-11-08";

function aberta(vencimento: string) {
  return { situacao: SITUACAO_FATURA.Aberta, vencimento };
}

describe("diasParaVencer", () => {
  it("conta dias à frente e para trás", () => {
    expect(diasParaVencer("2026-11-08", HOJE)).toBe(0);
    expect(diasParaVencer("2026-11-10", HOJE)).toBe(2);
    expect(diasParaVencer("2026-11-07", HOJE)).toBe(-1);
  });

  it("atravessa virada de mês e de ano", () => {
    expect(diasParaVencer("2026-12-01", "2026-11-30")).toBe(1);
    expect(diasParaVencer("2027-01-01", "2026-12-31")).toBe(1);
  });

  it("não é afetado por horário de verão", () => {
    expect(diasParaVencer("2026-11-02", "2026-10-31")).toBe(2);
    expect(diasParaVencer("2026-03-30", "2026-03-28")).toBe(2);
  });

  it("devolve NaN para data inválida", () => {
    expect(diasParaVencer("amanhã", HOJE)).toBeNaN();
  });
});

describe("avisoVencimento", () => {
  it("destaca fatura vencida", () => {
    expect(avisoVencimento(aberta("2026-11-07"), HOJE)).toEqual({ tipo: "vencida", texto: "Vencida ontem" });
    expect(avisoVencimento(aberta("2026-11-05"), HOJE)).toEqual({ tipo: "vencida", texto: "Vencida há 3 dias" });
  });

  it("avisa quando vence hoje", () => {
    expect(avisoVencimento(aberta(HOJE), HOJE)).toEqual({ tipo: "hoje", texto: "Vence hoje" });
  });

  it("dá ênfase de amanhã até 3 dias", () => {
    expect(avisoVencimento(aberta("2026-11-09"), HOJE)).toEqual({ tipo: "proxima", texto: "Vence amanhã · 09/11" });
    expect(avisoVencimento(aberta("2026-11-10"), HOJE)).toEqual({ tipo: "proxima", texto: "Vence em 2 dias · 10/11" });
    expect(avisoVencimento(aberta("2026-11-11"), HOJE)).toEqual({ tipo: "proxima", texto: "Vence em 3 dias · 11/11" });
  });

  it("fica neutro a partir de 4 dias", () => {
    expect(avisoVencimento(aberta("2026-11-12"), HOJE)).toEqual({ tipo: "futura", texto: "Vence em 12/11/2026" });
  });

  it("não avisa fatura paga nem cancelada", () => {
    expect(avisoVencimento({ situacao: SITUACAO_FATURA.Paga, vencimento: "2026-11-01" }, HOJE)).toBeNull();
    expect(avisoVencimento({ situacao: SITUACAO_FATURA.Cancelada, vencimento: "2026-11-01" }, HOJE)).toBeNull();
  });

  it("não avisa quando a data é inválida", () => {
    expect(avisoVencimento(aberta(""), HOJE)).toBeNull();
  });
});

describe("vencimentoEm", () => {
  it("soma dias a hoje, inclusive na virada de mês e de ano", () => {
    expect(vencimentoEm(HOJE, 7)).toBe("2026-11-15");
    expect(vencimentoEm(HOJE, 30)).toBe("2026-12-08");
    expect(vencimentoEm("2026-12-30", 7)).toBe("2027-01-06");
  });
});

describe("atalhoSelecionado", () => {
  it("reconhece o atalho que o valor representa", () => {
    expect(atalhoSelecionado(vencimentoEm(HOJE, 7), HOJE)).toBe("7");
    expect(atalhoSelecionado(vencimentoEm(HOJE, 15), HOJE)).toBe("15");
    expect(atalhoSelecionado(vencimentoEm(HOJE, 30), HOJE)).toBe("30");
  });

  it("devolve vazio quando nenhum atalho coincide", () => {
    expect(atalhoSelecionado("2026-11-20", HOJE)).toBe("");
    expect(atalhoSelecionado("", HOJE)).toBe("");
  });
});
