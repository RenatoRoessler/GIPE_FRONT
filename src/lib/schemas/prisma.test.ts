import { describe, expect, it } from "vitest";
import { criarPrismaEdicaoSchema, prismaCampo } from "./prisma";

describe("prismaCampo", () => {
  it("exigido: vazio pede o prisma e fora do intervalo diz a regra", () => {
    const schema = prismaCampo(true);
    expect(schema.safeParse("").error?.issues[0].message).toBe("Informe o prisma (de 1 a 999)");
    expect(schema.safeParse("0").error?.issues.map((issue) => issue.message)).toEqual(["Use um número de 1 a 999"]);
    expect(schema.safeParse("1000").success).toBe(false);
    expect(schema.safeParse(" 12 ").success).toBe(true);
  });

  it("não exigido: vazio passa, preenchido precisa ser válido", () => {
    const schema = prismaCampo(false);
    expect(schema.safeParse("").success).toBe(true);
    expect(schema.safeParse("999").success).toBe(true);
    expect(schema.safeParse("abc").success).toBe(false);
  });
});

describe("criarPrismaEdicaoSchema", () => {
  it("fora de mensalista o prisma é obrigatório", () => {
    const schema = criarPrismaEdicaoSchema({ mensalista: false });
    expect(schema.safeParse({ prisma: "" }).success).toBe(false);
    expect(schema.safeParse({ prisma: "7" }).success).toBe(true);
  });

  it("mensalista pode ficar sem prisma, mas o valor informado precisa ser válido", () => {
    const schema = criarPrismaEdicaoSchema({ mensalista: true });
    expect(schema.safeParse({ prisma: "" }).success).toBe(true);
    expect(schema.safeParse({ prisma: "1000" }).success).toBe(false);
  });
});
