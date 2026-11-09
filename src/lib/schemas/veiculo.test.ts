import { describe, expect, it } from "vitest";
import { COR_PADRAO, matchCor } from "@/types/veiculo";
import { criarEntradaVeiculoSchema, entradaVeiculoSchema } from "./veiculo";

const entradaValida = { placa: "ABC1D23", categoria: "2", modelo: "ONIX", cor: COR_PADRAO, prisma: "" };

describe("entradaVeiculoSchema", () => {
  it("aceita uma entrada válida", () => {
    expect(entradaVeiculoSchema.safeParse(entradaValida).success).toBe(true);
  });

  it("aceita cada cor do enum", () => {
    for (const cor of ["BRANCO", "PRETO", "PRATA", "CINZA", "VERMELHO", "AZUL", "VERDE", "BEGE"]) {
      expect(entradaVeiculoSchema.safeParse({ ...entradaValida, cor }).success).toBe(true);
    }
  });

  it("rejeita modelo vazio (o back o exige)", () => {
    expect(entradaVeiculoSchema.safeParse({ ...entradaValida, modelo: "  " }).success).toBe(false);
  });

  it("rejeita cor vazia ou fora do enum", () => {
    expect(entradaVeiculoSchema.safeParse({ ...entradaValida, cor: "" }).success).toBe(false);
    expect(entradaVeiculoSchema.safeParse({ ...entradaValida, cor: "ROSA" }).success).toBe(false);
  });
});

describe("criarEntradaVeiculoSchema", () => {
  const regras = { modelo: true, cor: true, prisma: false, mensalista: false };
  const campos = (resultado: { error?: { issues: { path: PropertyKey[] }[] } }) => resultado.error?.issues.map((issue) => issue.path[0]).sort();

  it("modelo e cor desligados aceitam vazio", () => {
    const schema = criarEntradaVeiculoSchema({ ...regras, modelo: false, cor: false });
    expect(schema.safeParse({ ...entradaValida, modelo: "", cor: "" }).success).toBe(true);
  });

  it("modelo e cor ligados recusam vazio", () => {
    expect(campos(criarEntradaVeiculoSchema(regras).safeParse({ ...entradaValida, modelo: "", cor: "" }))).toEqual(["cor", "modelo"]);
  });

  it("cor fora do enum é recusada mesmo desligada", () => {
    expect(criarEntradaVeiculoSchema({ ...regras, cor: false }).safeParse({ ...entradaValida, cor: "ROSA" }).success).toBe(false);
  });

  it("com o prisma ligado, exige o prisma, menos para mensalista", () => {
    const comPrisma = { ...regras, prisma: true };
    const resultado = criarEntradaVeiculoSchema(comPrisma).safeParse(entradaValida);
    expect(campos(resultado)).toEqual(["prisma"]);
    expect(resultado.error?.issues[0].message).toBe("Informe o prisma (de 1 a 999)");
    expect(criarEntradaVeiculoSchema(comPrisma).safeParse({ ...entradaValida, prisma: "55" }).success).toBe(true);
    expect(criarEntradaVeiculoSchema({ ...comPrisma, mensalista: true }).safeParse(entradaValida).success).toBe(true);
  });
});

describe("criarEntradaVeiculoSchema: prisma de 1 a 999", () => {
  const comPrisma = { modelo: true, cor: true, prisma: true, mensalista: false };
  const schema = criarEntradaVeiculoSchema(comPrisma);
  const mensagem = (prisma: string) => schema.safeParse({ ...entradaValida, prisma }).error?.issues[0]?.message;

  it("aceita os inteiros de 1 a 999", () => {
    for (const prisma of ["1", "45", "999"]) {
      expect(schema.safeParse({ ...entradaValida, prisma }).success).toBe(true);
    }
  });

  it("recusa 0, acima de 999, decimais e texto com a regra na mensagem", () => {
    for (const prisma of ["0", "1000", "1,5", "abc"]) {
      expect(mensagem(prisma)).toBe("Use um número de 1 a 999");
    }
  });

  it("desligado, vazio passa, mas valor preenchido continua precisando ser válido", () => {
    const desligado = criarEntradaVeiculoSchema({ ...comPrisma, prisma: false });
    expect(desligado.safeParse(entradaValida).success).toBe(true);
    expect(desligado.safeParse({ ...entradaValida, prisma: "1000" }).success).toBe(false);
  });
});

describe("matchCor", () => {
  it("ignora caixa, espaços e acentos", () => {
    expect(matchCor("prata")).toBe("PRATA");
    expect(matchCor("  Bege ")).toBe("BEGE");
  });

  it("devolve null para cor desconhecida ou vazia", () => {
    expect(matchCor("cinza claro")).toBeNull();
    expect(matchCor("")).toBeNull();
    expect(matchCor(null)).toBeNull();
  });
});
