import { describe, expect, it } from "vitest";
import { configuracaoSchema } from "./configuracao";

describe("configuracaoSchema", () => {
  it("aceita três booleanos", () => {
    expect(configuracaoSchema.safeParse({ modelo: true, cor: false, prisma: true }).success).toBe(true);
  });

  it("rejeita valor de outro tipo ou campo faltando", () => {
    expect(configuracaoSchema.safeParse({ modelo: "sim", cor: true, prisma: true }).success).toBe(false);
    expect(configuracaoSchema.safeParse({ modelo: true, cor: true }).success).toBe(false);
  });
});
