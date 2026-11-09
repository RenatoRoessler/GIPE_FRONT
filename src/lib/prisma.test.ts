import { describe, expect, it } from "vitest";
import { PRISMA_INTERVALO_MESSAGE, PRISMA_OBRIGATORIO_MESSAGE, prismaDoTexto, somenteDigitosDoPrisma } from "./prisma";

describe("prismaDoTexto", () => {
  it("aceita os inteiros de 1 a 999", () => {
    expect(prismaDoTexto("1")).toBe(1);
    expect(prismaDoTexto("45")).toBe(45);
    expect(prismaDoTexto("999")).toBe(999);
  });

  it("zeros à esquerda não mudam o número", () => {
    expect(prismaDoTexto("007")).toBe(7);
  });

  it("vazio, zero e acima de 999 não são prisma", () => {
    expect(prismaDoTexto("")).toBeNull();
    expect(prismaDoTexto("  ")).toBeNull();
    expect(prismaDoTexto("0")).toBeNull();
    expect(prismaDoTexto("000")).toBeNull();
    expect(prismaDoTexto("1000")).toBeNull();
  });

  it("decimais, negativos e texto não são prisma", () => {
    for (const texto of ["1,5", "1.5", "-3", "abc", "12a", "1e2"]) {
      expect(prismaDoTexto(texto)).toBeNull();
    }
  });
});

describe("somenteDigitosDoPrisma", () => {
  it("tira o que não é dígito e corta em 3", () => {
    expect(somenteDigitosDoPrisma("a1b2")).toBe("12");
    expect(somenteDigitosDoPrisma("12345")).toBe("123");
    expect(somenteDigitosDoPrisma("-,.")).toBe("");
  });
});

describe("mensagens", () => {
  it("dizem a regra de 1 a 999", () => {
    expect(PRISMA_OBRIGATORIO_MESSAGE).toBe("Informe o prisma (de 1 a 999)");
    expect(PRISMA_INTERVALO_MESSAGE).toBe("Use um número de 1 a 999");
  });
});
