import { describe, expect, it } from "vitest";
import { COR_PADRAO, matchCor } from "@/types/veiculo";
import { entradaVeiculoSchema } from "./veiculo";

const entradaValida = { placa: "ABC1D23", categoria: "2", modelo: "ONIX", cor: COR_PADRAO, mensalista: false };

describe("entradaVeiculoSchema", () => {
  it("aceita uma entrada válida", () => {
    expect(entradaVeiculoSchema.safeParse(entradaValida).success).toBe(true);
  });

  it("aceita cada cor do enum", () => {
    for (const cor of ["BRANCO", "PRETO", "PRATA", "CINZA", "VERMELHO", "AZUL", "VERDE", "BEGE"]) {
      expect(entradaVeiculoSchema.safeParse({ ...entradaValida, cor }).success).toBe(true);
    }
  });

  it("rejeita cor vazia ou fora do enum", () => {
    expect(entradaVeiculoSchema.safeParse({ ...entradaValida, cor: "" }).success).toBe(false);
    expect(entradaVeiculoSchema.safeParse({ ...entradaValida, cor: "ROSA" }).success).toBe(false);
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
