import { describe, expect, it } from "vitest";
import type { PatioFiltros } from "@/types/patio";
import { gravarFiltros, hrefDaLista, hrefDoComprovante, hrefDoTicket, lerFiltros } from "./patioUrl";

const padrao: PatioFiltros = { busca: "", tipo: "todos", categoria: "todas", chave: "todas" };

describe("patioUrl", () => {
  it("sem parâmetros vale tudo", () => {
    expect(lerFiltros(new URLSearchParams())).toEqual(padrao);
    expect(gravarFiltros(padrao)).toBe("");
    expect(hrefDaLista(padrao)).toBe("/patio");
  });

  it("ida e volta de todos os filtros", () => {
    const filtros: PatioFiltros = { busca: "gol prata", tipo: "mensalistas", categoria: 3, chave: "fora" };
    const query = gravarFiltros(filtros);
    expect(lerFiltros(new URLSearchParams(query))).toEqual(filtros);
  });

  it("categoria zero é um filtro válido", () => {
    expect(lerFiltros(new URLSearchParams("cat=0")).categoria).toBe(0);
  });

  it("valores inválidos viram todos", () => {
    expect(lerFiltros(new URLSearchParams("tipo=xyz&cat=abc&chave=talvez"))).toEqual(padrao);
    expect(lerFiltros(new URLSearchParams("cat=-1")).categoria).toBe("todas");
    expect(lerFiltros(new URLSearchParams("cat=1.5")).categoria).toBe("todas");
  });

  it("não grava a busca só com espaços", () => {
    expect(gravarFiltros({ ...padrao, busca: "   " })).toBe("");
  });

  it("monta os endereços do ticket e do comprovante com os filtros", () => {
    expect(hrefDoTicket(12, padrao)).toBe("/patio/12");
    expect(hrefDoTicket(12, { ...padrao, tipo: "avulsos" })).toBe("/patio/12?tipo=avulsos");
    expect(hrefDoComprovante(12, "")).toBe("/patio/12/comprovante");
    expect(hrefDoComprovante(12, "tipo=avulsos")).toBe("/patio/12/comprovante?tipo=avulsos");
  });
});
