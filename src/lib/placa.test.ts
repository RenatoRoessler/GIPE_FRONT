import { describe, expect, it } from "vitest";
import { getPlacaTipo } from "./placa";

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
