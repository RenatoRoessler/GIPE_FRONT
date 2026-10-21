import { describe, expect, it } from "vitest";
import { formatDataHora, formatHash } from "./format";

// 64 caracteres hexadecimais (SHA-256) = 16 grupos de 4.
const HASH = "9f3a1c07aabbccdd1122334455667788d9e2c21b99887766554433221100ffee";

describe("formatHash", () => {
  it("abreviado mostra só as pontas, em grupos de 4 e maiúsculas", () => {
    expect(formatHash(HASH)).toBe("9F3A 1C07 … 1100 FFEE");
  });

  it("completo mostra todos os grupos", () => {
    expect(formatHash(HASH, true)).toBe(
      "9F3A 1C07 AABB CCDD 1122 3344 5566 7788 D9E2 C21B 9988 7766 5544 3322 1100 FFEE",
    );
  });

  it("hash curto não é abreviado", () => {
    expect(formatHash("abcd1234")).toBe("ABCD 1234");
  });

  it("vazio devolve vazio", () => {
    expect(formatHash("")).toBe("");
  });
});

describe("formatDataHora", () => {
  it("junta data e hora com 'às'", () => {
    // O ano curto ("26" ou "2026") depende da versão do ICU do ambiente.
    expect(formatDataHora("2026-10-21T14:32:05.1234567")).toMatch(/^21\/10\/(20)?26 às 14:32$/);
  });

  it("sem data devolve um traço", () => {
    expect(formatDataHora(null)).toBe("—");
  });
});
