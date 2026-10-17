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
    ["gipe.com.br/comprovante/7K3Q9X", "7K3Q9X"],
    ["http://192.168.0.10:3000/comprovante/7K3Q9X", "7K3Q9X"],
    ["https://gipe.com.br/Comprovante/7K3Q9X/extra", "7K3Q9X"],
    ["https://gipe.com.br/comprovante/7K3Q9X%20", "7K3Q9X"],
    ["https://gipe.com.br/qualquer?token=7K3Q9X", "7K3Q9X"],
    ["GIPE-SAIDA:7K3Q9X", "7K3Q9X"],
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
    "https://gipe.com.br/comprovante/%E0%A4%A",
    "https://gipe.com.br/qualquer?token=AB1",
    "gipe.com.br",
  ])("rejeita %j", (texto) => {
    expect(extrairTokenComprovante(texto)).toBeNull();
  });
});
