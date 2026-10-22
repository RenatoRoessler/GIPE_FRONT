import { describe, expect, it } from "vitest";
import { formatPlacaExibicao, getPlacaTipo } from "./placa";

describe("getPlacaTipo", () => {
  it("reconhece o padrão antigo pelo 5º caractere numérico", () => {
    expect(getPlacaTipo("ABC1234")).toBe("antiga");
    expect(getPlacaTipo("abc-1234")).toBe("antiga");
  });

  it("reconhece o Mercosul pelo 5º caractere de letra", () => {
    expect(getPlacaTipo("ABC1D23")).toBe("mercosul");
    expect(getPlacaTipo("ABC1D")).toBe("mercosul");
  });

  it("devolve null enquanto a placa tem menos de 5 caracteres", () => {
    expect(getPlacaTipo("")).toBeNull();
    expect(getPlacaTipo("ABC1")).toBeNull();
  });
});

describe("formatPlacaExibicao", () => {
  it("a placa do padrão antigo ganha o hífen", () => {
    expect(formatPlacaExibicao("HZB5188")).toBe("HZB-5188");
    expect(formatPlacaExibicao("hzb-5188")).toBe("HZB-5188");
  });

  it("a Mercosul e o que não é placa ficam como estão", () => {
    expect(formatPlacaExibicao("BRA2E19")).toBe("BRA2E19");
    expect(formatPlacaExibicao("")).toBe("");
    expect(formatPlacaExibicao("AB")).toBe("AB");
  });
});
