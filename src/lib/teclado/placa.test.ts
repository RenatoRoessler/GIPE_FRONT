import { describe, expect, it } from "vitest";
import { aceitaPlaca, placaCompletaValida, tipoPosicaoPlaca } from "./placa";

describe("tipoPosicaoPlaca", () => {
  it("segue a tabela de posições", () => {
    expect([0, 1, 2].map(tipoPosicaoPlaca)).toEqual(["L", "L", "L"]);
    expect(tipoPosicaoPlaca(3)).toBe("N");
    expect(tipoPosicaoPlaca(4)).toBe("LN");
    expect([5, 6].map(tipoPosicaoPlaca)).toEqual(["N", "N"]);
  });

  it("devolve null com a placa cheia", () => {
    expect(tipoPosicaoPlaca(7)).toBeNull();
    expect(tipoPosicaoPlaca(10)).toBeNull();
  });
});

describe("aceitaPlaca", () => {
  it("aceita só letras nas 3 primeiras posições", () => {
    expect(aceitaPlaca("A", 0)).toBe(true);
    expect(aceitaPlaca("b", 2)).toBe(true);
    expect(aceitaPlaca("1", 1)).toBe(false);
  });

  it("aceita só número na 4ª posição", () => {
    expect(aceitaPlaca("1", 3)).toBe(true);
    expect(aceitaPlaca("A", 3)).toBe(false);
  });

  it("aceita letra ou número na 5ª posição (Mercosul e antiga)", () => {
    expect(aceitaPlaca("D", 4)).toBe(true);
    expect(aceitaPlaca("2", 4)).toBe(true);
  });

  it("aceita só número nas posições 6 e 7", () => {
    expect(aceitaPlaca("3", 5)).toBe(true);
    expect(aceitaPlaca("A", 6)).toBe(false);
  });

  it("recusa tudo com a placa cheia e caractere inválido", () => {
    expect(aceitaPlaca("1", 7)).toBe(false);
    expect(aceitaPlaca("-", 0)).toBe(false);
    expect(aceitaPlaca("AB", 0)).toBe(false);
    expect(aceitaPlaca("", 0)).toBe(false);
  });
});

describe("placaCompletaValida", () => {
  it("reconhece Mercosul e padrão antigo completos", () => {
    expect(placaCompletaValida("ABC1D23")).toBe(true);
    expect(placaCompletaValida("ABC1234")).toBe(true);
    expect(placaCompletaValida("ABC12")).toBe(false);
  });
});
