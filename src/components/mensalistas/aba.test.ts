import { describe, expect, it } from "vitest";
import { abaUrl, LISTA_URL, parseAba } from "./aba";

describe("parseAba", () => {
  it("reconhece as abas válidas", () => {
    expect(parseAba("agenda")).toBe("agenda");
    expect(parseAba("lista")).toBe("lista");
    expect(parseAba("tipos")).toBe("tipos");
  });

  it("cai na agenda quando ausente ou inválida", () => {
    expect(parseAba(null)).toBe("agenda");
    expect(parseAba("")).toBe("agenda");
    expect(parseAba("outra")).toBe("agenda");
    // O nome antigo da aba não vale mais.
    expect(parseAba("mensalistas")).toBe("agenda");
  });

  it("endereço antigo com pagina e sem aba abre a lista", () => {
    expect(parseAba(null, { temPagina: true })).toBe("lista");
    expect(parseAba("outra", { temPagina: true })).toBe("lista");
  });

  it("a aba explícita vence a página", () => {
    expect(parseAba("tipos", { temPagina: true })).toBe("tipos");
    expect(parseAba("agenda", { temPagina: true })).toBe("agenda");
  });
});

describe("abaUrl", () => {
  it("a agenda, por ser a padrão, fica sem parâmetro", () => {
    expect(abaUrl("agenda")).toBe("/mensalistas");
    expect(abaUrl("lista")).toBe(LISTA_URL);
    expect(abaUrl("tipos")).toBe("/mensalistas?aba=tipos");
  });
});
