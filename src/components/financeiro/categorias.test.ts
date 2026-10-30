import { describe, expect, it } from "vitest";
import { TIPO_LANCAMENTO, type FinanceiroCategoria } from "@/types/financeiro";
import { agrupaOutras, montarArvore, opcoesDeCategoria, paisElegiveis, separarPorTipo, tipoDoLancamento, tipoPorCategoria } from "./categorias";

const { Entrada, Saida } = TIPO_LANCAMENTO;

function cat(id: number, nome: string, tipo: 1 | 2, extra: Partial<FinanceiroCategoria> = {}): FinanceiroCategoria {
  return { financeiroCategoriaId: id, nome, tipo, financeiroCategoriaPaiId: null, categoriaPai: null, ativo: true, ...extra };
}

// Na ordem da API: por tipo e nome, cada pai seguido das filhas.
const categorias = [
  cat(1, "Outras receitas", Entrada),
  cat(2, "Venda de sucata", Entrada, { financeiroCategoriaPaiId: 1, categoriaPai: "Outras receitas" }),
  cat(3, "Despesas fixas", Saida),
  cat(4, "Aluguel", Saida, { financeiroCategoriaPaiId: 3, categoriaPai: "Despesas fixas" }),
  cat(5, "Energia", Saida, { financeiroCategoriaPaiId: 3, categoriaPai: "Despesas fixas", ativo: false }),
  cat(6, "Manutenção", Saida, { ativo: false }),
];

describe("montarArvore", () => {
  it("sem filtro, cada pai traz as filhas", () => {
    const nos = montarArvore(categorias);

    expect(nos.map((no) => [no.categoria.nome, no.filhas.map((filha) => filha.nome)])).toEqual([
      ["Outras receitas", ["Venda de sucata"]],
      ["Despesas fixas", ["Aluguel", "Energia"]],
      ["Manutenção", []],
    ]);
    expect(nos.every((no) => !no.soContexto)).toBe(true);
  });

  it("filtra por tipo", () => {
    expect(montarArvore(categorias, { tipo: Entrada }).map((no) => no.categoria.nome)).toEqual(["Outras receitas"]);
    expect(montarArvore(categorias, { tipo: Saida }).map((no) => no.categoria.nome)).toEqual(["Despesas fixas", "Manutenção"]);
  });

  it("filtra por situação, tirando as filhas que não passam", () => {
    const ativas = montarArvore(categorias, { situacao: "ativas" });

    expect(ativas.map((no) => [no.categoria.nome, no.filhas.map((filha) => filha.nome)])).toEqual([
      ["Outras receitas", ["Venda de sucata"]],
      ["Despesas fixas", ["Aluguel"]],
    ]);
    expect(montarArvore(categorias, { situacao: "inativas" }).map((no) => [no.categoria.nome, no.filhas.map((filha) => filha.nome)])).toEqual([
      ["Despesas fixas", ["Energia"]],
      ["Manutenção", []],
    ]);
  });

  it("mostra o pai como contexto quando só a filha passa no filtro", () => {
    const nos = montarArvore(categorias, { situacao: "inativas" });

    expect(nos[0]).toMatchObject({ soContexto: true });
    expect(nos[1]).toMatchObject({ soContexto: false });
  });

  it("filha cujo pai não veio na lista vira principal", () => {
    const nos = montarArvore([cat(9, "Órfã", Saida, { financeiroCategoriaPaiId: 99 })]);

    expect(nos.map((no) => no.categoria.nome)).toEqual(["Órfã"]);
  });

  it("lista vazia, árvore vazia", () => {
    expect(montarArvore([])).toEqual([]);
  });
});

describe("separarPorTipo", () => {
  it("divide em receitas e despesas", () => {
    const { receitas, despesas } = separarPorTipo(montarArvore(categorias));

    expect(receitas.map((no) => no.categoria.nome)).toEqual(["Outras receitas"]);
    expect(despesas.map((no) => no.categoria.nome)).toEqual(["Despesas fixas", "Manutenção"]);
  });
});

describe("opcoesDeCategoria", () => {
  it("por tipo, só ativas, com as filhas recuadas", () => {
    expect(opcoesDeCategoria(categorias, { tipo: Saida })).toEqual([
      { value: "3", label: "Despesas fixas" },
      { value: "4", label: "↳ Aluguel" },
    ]);
  });

  it("mantém a categoria do lançamento em edição, marcada como inativa", () => {
    expect(opcoesDeCategoria(categorias, { tipo: Saida, manterId: 5 })).toEqual([
      { value: "3", label: "Despesas fixas" },
      { value: "4", label: "↳ Aluguel" },
      { value: "5", label: "↳ Energia (inativa)" },
    ]);
  });

  it("filha ativa de pai inativo leva o nome do pai", () => {
    const lista = [cat(1, "Fixas", Saida, { ativo: false }), cat(2, "Aluguel", Saida, { financeiroCategoriaPaiId: 1 })];

    expect(opcoesDeCategoria(lista, { tipo: Saida })).toEqual([{ value: "2", label: "Fixas › Aluguel" }]);
  });

  it("no filtro da lista (apenasAtivas false) aparecem todas, com as inativas marcadas", () => {
    expect(opcoesDeCategoria(categorias, { apenasAtivas: false }).map((opcao) => opcao.label)).toEqual([
      "Outras receitas",
      "↳ Venda de sucata",
      "Despesas fixas",
      "↳ Aluguel",
      "↳ Energia (inativa)",
      "Manutenção (inativa)",
    ]);
  });

  it("sem categorias, sem opções", () => {
    expect(opcoesDeCategoria([], { tipo: Saida })).toEqual([]);
  });
});

describe("paisElegiveis", () => {
  it("ativos, do mesmo tipo, sem pai", () => {
    expect(paisElegiveis(categorias, { tipo: Saida }).map((categoria) => categoria.nome)).toEqual(["Despesas fixas"]);
    expect(paisElegiveis(categorias, { tipo: Entrada }).map((categoria) => categoria.nome)).toEqual(["Outras receitas"]);
  });

  it("não oferece a própria categoria", () => {
    expect(paisElegiveis(categorias, { tipo: Saida, categoriaId: 3 })).toEqual([]);
  });
});

describe("agrupaOutras", () => {
  it("é verdadeiro para quem tem filhas, ativas ou não", () => {
    expect(agrupaOutras(categorias, 3)).toBe(true);
    expect(agrupaOutras(categorias, 1)).toBe(true);
  });

  it("é falso para quem não tem", () => {
    expect(agrupaOutras(categorias, 6)).toBe(false);
    expect(agrupaOutras(categorias, 4)).toBe(false);
  });
});

describe("tipoDoLancamento", () => {
  const tipos = tipoPorCategoria(categorias);

  it("usa o tipo da resposta e, sem ele, o da categoria", () => {
    expect(tipoDoLancamento({ tipo: Entrada, financeiroCategoriaId: 4 }, tipos)).toBe(Entrada);
    expect(tipoDoLancamento({ tipo: null, financeiroCategoriaId: 4 }, tipos)).toBe(Saida);
  });

  it("sem nenhum dos dois, é nulo", () => {
    expect(tipoDoLancamento({ tipo: null, financeiroCategoriaId: 99 }, tipos)).toBeNull();
  });
});
