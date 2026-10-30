import { describe, expect, it } from "vitest";
import { TIPO_LANCAMENTO, type FluxoCategoria } from "@/types/financeiro";
import { montarComposicao } from "./composicao";

function item(parcial: Partial<FluxoCategoria>): FluxoCategoria {
  return { origem: 3, tipo: TIPO_LANCAMENTO.Saida, financeiroCategoriaId: null, categoria: "", financeiroCategoriaPaiId: null, categoriaPai: null, valor: 0, ...parcial };
}

const rotativo = item({ origem: 1, tipo: 1, categoria: "Estacionamento rotativo", valor: 74810 });
const mensalidades = item({ origem: 2, tipo: 1, categoria: "Mensalidades", valor: 300 });

describe("montarComposicao", () => {
  it("só rotativo e mensalidades: saídas vazias, grupos sem linhas e percentuais sobre o total do lado", () => {
    const { entradas, saidas } = montarComposicao([rotativo, mensalidades]);

    expect(entradas.total).toBe(75110);
    expect(entradas.grupos.map((grupo) => [grupo.titulo, grupo.valor, grupo.linhas.length])).toEqual([
      ["Estacionamento rotativo", 74810, 0],
      ["Mensalidades", 300, 0],
    ]);
    expect(entradas.grupos[0].percentual).toBeCloseTo(99.6, 1);
    expect(entradas.grupos[1].percentual).toBeCloseTo(0.4, 1);
    expect(saidas).toEqual({ total: 0, grupos: [] });
  });

  it("mantém a ordem rotativo, mensalidades e lançamentos, seja qual for a ordem da resposta", () => {
    const { entradas } = montarComposicao([item({ tipo: 1, origem: 3, financeiroCategoriaId: 1, categoria: "Outras receitas", valor: 50 }), mensalidades, rotativo]);

    expect(entradas.grupos.map((grupo) => grupo.titulo)).toEqual(["Estacionamento rotativo", "Mensalidades", "Lançamentos"]);
  });

  it("agrupa os lançamentos pela categoria pai, que soma o próprio valor e o das filhas", () => {
    const { saidas } = montarComposicao([
      item({ financeiroCategoriaId: 1, categoria: "Despesas fixas", valor: 100 }),
      item({ financeiroCategoriaId: 2, categoria: "Aluguel", financeiroCategoriaPaiId: 1, categoriaPai: "Despesas fixas", valor: 2000 }),
      item({ financeiroCategoriaId: 3, categoria: "Energia", financeiroCategoriaPaiId: 1, categoriaPai: "Despesas fixas", valor: 450 }),
    ]);

    const [grupo] = saidas.grupos;
    expect(saidas.total).toBe(2550);
    expect(grupo.titulo).toBe("Lançamentos");
    expect(grupo.linhas).toHaveLength(1);
    expect(grupo.linhas[0]).toMatchObject({ nome: "Despesas fixas", valor: 2550, categoriaId: 1 });
    expect(grupo.linhas[0].filhas.map((filha) => [filha.nome, filha.valor, filha.categoriaId])).toEqual([
      ["Aluguel", 2000, 2],
      ["Energia", 450, 3],
    ]);
  });

  it("cria o pai a partir de categoriaPai quando só as filhas têm valor", () => {
    const { saidas } = montarComposicao([item({ financeiroCategoriaId: 2, categoria: "Aluguel", financeiroCategoriaPaiId: 1, categoriaPai: "Despesas fixas", valor: 2000 })]);

    expect(saidas.grupos[0].linhas[0]).toMatchObject({ nome: "Despesas fixas", valor: 2000, categoriaId: 1 });
  });

  it("ordena por valor, do maior para o menor, e calcula o percentual sobre o total do lado", () => {
    const { saidas } = montarComposicao([
      item({ financeiroCategoriaId: 1, categoria: "Manutenção", valor: 100 }),
      item({ financeiroCategoriaId: 2, categoria: "Salários", valor: 300 }),
    ]);

    expect(saidas.grupos[0].linhas.map((linha) => [linha.nome, linha.percentual])).toEqual([
      ["Salários", 75],
      ["Manutenção", 25],
    ]);
  });

  it("omite valores zerados, em grupos, linhas e filhas", () => {
    const { saidas, entradas } = montarComposicao([
      item({ tipo: 1, origem: 2, categoria: "Mensalidades", valor: 0 }),
      item({ financeiroCategoriaId: 1, categoria: "Aluguel", valor: 0 }),
      item({ financeiroCategoriaId: 2, categoria: "Energia", financeiroCategoriaPaiId: 9, categoriaPai: "Fixas", valor: 0 }),
    ]);

    expect(entradas).toEqual({ total: 0, grupos: [] });
    expect(saidas).toEqual({ total: 0, grupos: [] });
  });

  it("separa entradas de saídas pelo tipo", () => {
    const { entradas, saidas } = montarComposicao([rotativo, item({ financeiroCategoriaId: 1, categoria: "Aluguel", valor: 2000 })]);

    expect(entradas.total).toBe(74810);
    expect(saidas.total).toBe(2000);
  });

  it("origem que o front não conhece aparece com o nome do back", () => {
    const { entradas } = montarComposicao([item({ origem: 7, tipo: 1, categoria: "Origem nova", valor: 10 })]);

    expect(entradas.grupos[0]).toMatchObject({ titulo: "Origem nova", valor: 10, linhas: [] });
  });

  it("lançamento sem id de categoria usa o nome como chave", () => {
    const { saidas } = montarComposicao([item({ categoria: "Sem id", valor: 10 }), item({ categoria: "Sem id", valor: 5 })]);

    expect(saidas.grupos[0].linhas).toHaveLength(1);
    expect(saidas.grupos[0].linhas[0]).toMatchObject({ nome: "Sem id", valor: 15, categoriaId: null });
  });

  it("arredonda centavos para não acumular erro de ponto flutuante", () => {
    const { saidas } = montarComposicao([item({ financeiroCategoriaId: 1, categoria: "A", valor: 0.1 }), item({ financeiroCategoriaId: 1, categoria: "A", valor: 0.2 })]);

    expect(saidas.grupos[0].linhas[0].valor).toBe(0.3);
    expect(saidas.total).toBe(0.3);
  });
});
