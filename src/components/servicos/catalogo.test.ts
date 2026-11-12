import { describe, expect, it } from "vitest";
import type { Servico } from "@/types/servico";
import { ehSituacao, filtrarServicos, linhasDePreco, lerServicoDaUrl, normalizarBusca, precoParaCategoria } from "./catalogo";

const servico = (id: number, nome: string, ativo = true, precos: Servico["precos"] = []): Servico => ({
  id,
  nome,
  descricao: null,
  duracaoMinutos: null,
  tempoPermitidoMinutos: null,
  ativo,
  precos,
});

const preco = (categoria: number, valorCentavos: number) => ({ categoria, descricao: "x", valorCentavos });

describe("normalizarBusca", () => {
  it("ignora acento, caixa e espaços nas pontas", () => {
    expect(normalizarBusca("  Polimênto ")).toBe("polimento");
  });
});

describe("filtrarServicos", () => {
  const lista = [servico(1, "Lavagem completa"), servico(2, "Polimento", false), servico(3, "Lavagem técnica", false)];

  it("filtra por situação", () => {
    expect(filtrarServicos(lista, { situacao: "ativos", q: "" }).map((s) => s.id)).toEqual([1]);
    expect(filtrarServicos(lista, { situacao: "inativos", q: "" }).map((s) => s.id)).toEqual([2, 3]);
    expect(filtrarServicos(lista, { situacao: "todos", q: "" }).map((s) => s.id)).toEqual([1, 2, 3]);
  });

  it("busca pelo nome, sem acento nem caixa, e combina com a situação", () => {
    expect(filtrarServicos(lista, { situacao: "todos", q: "LAVAGEM" }).map((s) => s.id)).toEqual([1, 3]);
    expect(filtrarServicos(lista, { situacao: "inativos", q: "lavagem" }).map((s) => s.id)).toEqual([3]);
    expect(filtrarServicos(lista, { situacao: "todos", q: "xyz" })).toEqual([]);
  });
});

describe("lerServicoDaUrl", () => {
  it("só aceita inteiro positivo", () => {
    expect(lerServicoDaUrl("12")).toBe(12);
    for (const ruim of [null, "", "0", "-1", "1.5", "abc", "12a", "01"]) {
      expect(lerServicoDaUrl(ruim)).toBeNull();
    }
  });
});

describe("ehSituacao", () => {
  it("reconhece as três situações", () => {
    expect(ehSituacao("ativos")).toBe(true);
    expect(ehSituacao("qualquer")).toBe(false);
  });
});

describe("linhasDePreco", () => {
  it("só a categoria 99 vira uma linha única", () => {
    expect(linhasDePreco(servico(1, "A", true, [preco(99, 5000)]))).toEqual([{ categoria: 99, rotulo: "Todas as categorias", valorCentavos: 5000, geral: false }]);
  });

  it("com preços próprios, mostra as seis categorias e o não atendimento", () => {
    const linhas = linhasDePreco(servico(1, "A", true, [preco(2, 4000), preco(6, 8000)]));

    expect(linhas).toHaveLength(6);
    expect(linhas.find((l) => l.categoria === 2)).toMatchObject({ rotulo: "Carro pequeno", valorCentavos: 4000, geral: false });
    expect(linhas.find((l) => l.categoria === 1)).toMatchObject({ valorCentavos: null, geral: false });
  });

  it("com preços próprios e o geral, as sem preço próprio mostram o valor geral marcado", () => {
    const linhas = linhasDePreco(servico(1, "A", true, [preco(2, 4000), preco(99, 5000)]));

    expect(linhas.find((l) => l.categoria === 2)).toMatchObject({ valorCentavos: 4000, geral: false });
    expect(linhas.find((l) => l.categoria === 5)).toMatchObject({ valorCentavos: 5000, geral: true });
  });

  it("sem nenhum preço, sem linhas", () => {
    expect(linhasDePreco(servico(1, "A"))).toEqual([]);
  });
});

describe("precoParaCategoria", () => {
  it("usa o preço da categoria e, sem ele, o de Todas", () => {
    const s = servico(1, "Lavagem", true, [preco(99, 5000), preco(2, 8000)]);

    expect(precoParaCategoria(s, 2)).toBe(8000);
    expect(precoParaCategoria(s, 4)).toBe(5000);
  });

  it("devolve nulo quando o serviço não atende a categoria", () => {
    expect(precoParaCategoria(servico(1, "Polimento", true, [preco(2, 8000)]), 4)).toBeNull();
    expect(precoParaCategoria(servico(2, "Sem preço"), 2)).toBeNull();
  });
});
