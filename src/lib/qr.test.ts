import { describe, expect, it } from "vitest";
import { extrairTokenComprovante } from "./qr";

describe("extrairTokenComprovante", () => {
  it.each([
    ["https://gipe.com.br/comprovante/7K3Q9X", "7K3Q9X"],
    ["https://hml.gipe.com.br/comprovante/7K3Q9X/", "7K3Q9X"],
    ["http://localhost:3000/comprovante/abc123?x=1#y", "abc123"],
    ["  https://gipe.com.br/comprovante/7K3Q9X  ", "7K3Q9X"],
    ["7K3Q9X", "7K3Q9X"],
    ["aB12cD34", "aB12cD34"],
  ])("extrai o token de %s", (texto, esperado) => {
    expect(extrairTokenComprovante(texto)).toBe(esperado);
  });

  it.each([
    "",
    "   ",
    "olá mundo",
    "https://gipe.com.br/outra/7K3Q9X",
    "https://gipe.com.br/comprovante/",
    "https://gipe.com.br/comprovante/AB1",
    `https://gipe.com.br/comprovante/${"A".repeat(33)}`,
    "ABC",
    "GIPE-SAIDA:7K3Q9X",
  ])("rejeita %j", (texto) => {
    expect(extrairTokenComprovante(texto)).toBeNull();
  });
});
