import { describe, expect, it } from "vitest";
import { telaInicial } from "./telaInicial";

describe("telaInicial", () => {
  it("tela grande abre o Dashboard", () => {
    expect(telaInicial(1, true)).toBe("/dashboard");
    expect(telaInicial(4, true)).toBe("/dashboard");
  });

  it("tela pequena abre o Pátio para quem acessa o Pátio", () => {
    expect(telaInicial(1, false)).toBe("/patio");
    expect(telaInicial(3, false)).toBe("/patio");
    expect(telaInicial(4, false)).toBe("/patio");
  });

  it("tela pequena abre o Dashboard para quem não acessa o Pátio ou não tem perfil", () => {
    expect(telaInicial(8, false)).toBe("/dashboard");
    expect(telaInicial(5, false)).toBe("/dashboard");
    expect(telaInicial(null, false)).toBe("/dashboard");
    expect(telaInicial(undefined, false)).toBe("/dashboard");
  });
});
