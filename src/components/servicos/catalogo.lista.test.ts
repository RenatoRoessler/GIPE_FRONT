import { describe, expect, it } from "vitest";
import type { Servico } from "@/types/servico";
import { categoriasAtendidas, faixaDeDuracao, faixaDePreco, filtrarServicos, gratisDoServico, resumirCatalogo, resumoDeTempos } from "./catalogo";

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

describe("filtrarServicos por descrição", () => {
  const lista = [{ ...servico(1, "Lavagem"), descricao: "Aspiração e pretinho" }, servico(2, "Cera")];

  it("só casa a descrição quando pedido", () => {
    expect(filtrarServicos(lista, { situacao: "todos", q: "aspiracao" }).map((s) => s.id)).toEqual([]);
    expect(filtrarServicos(lista, { situacao: "todos", q: "aspiracao", incluirDescricao: true }).map((s) => s.id)).toEqual([1]);
  });
});

describe("faixaDePreco", () => {
  it("preço único quando todas as categorias custam o mesmo", () => {
    expect(faixaDePreco(servico(1, "A", true, [preco(99, 5000)]))).toEqual({ minimoCentavos: 5000, maximoCentavos: 5000, unico: true });
  });

  it("faixa entre o menor e o maior preço das categorias que atende", () => {
    expect(faixaDePreco(servico(1, "A", true, [preco(1, 2000), preco(3, 7000)]))).toEqual({
      minimoCentavos: 2000,
      maximoCentavos: 7000,
      unico: false,
    });
  });

  it("sem preço, nulo", () => {
    expect(faixaDePreco(servico(1, "A"))).toBeNull();
  });
});

describe("faixaDeDuracao e gratisDoServico", () => {
  it("usa o valor do serviço quando a categoria não traz o seu", () => {
    const s = { ...servico(1, "A", true, [preco(1, 2000), preco(3, 7000)]), duracaoMinutos: 30, tempoPermitidoMinutos: 60 };
    expect(faixaDeDuracao(s)).toEqual({ minimo: 30, maximo: 30 });
    expect(gratisDoServico(s)).toBe("até 1 h grátis");
  });

  it("usa o valor da categoria quando existe", () => {
    const s = servico(1, "A", true, [
      { ...preco(1, 2000), duracaoMinutos: 20, tempoPermitidoMinutos: 30 },
      { ...preco(3, 7000), duracaoMinutos: 90, tempoPermitidoMinutos: 120 },
    ]);
    expect(faixaDeDuracao(s)).toEqual({ minimo: 20, maximo: 90 });
    expect(gratisDoServico(s)).toBe("até 2 h grátis");
  });

  it("sem previsão e sem tempo permitido, nulos", () => {
    const s = servico(1, "A", true, [preco(1, 2000)]);
    expect(faixaDeDuracao(s)).toBeNull();
    expect(gratisDoServico(s)).toBeNull();
  });

  it("sem preços, cai nos valores do serviço", () => {
    expect(faixaDeDuracao({ ...servico(1, "A"), duracaoMinutos: 45 })).toEqual({ minimo: 45, maximo: 45 });
  });
});

describe("categoriasAtendidas", () => {
  it("marca só as categorias com preço próprio", () => {
    const atendidas = categoriasAtendidas(servico(1, "A", true, [preco(1, 2000), preco(3, 7000)]));
    expect(atendidas).toHaveLength(6);
    expect(atendidas.filter((c) => c.atende).map((c) => c.categoria)).toEqual([1, 3]);
  });

  it("preço de Todas atende as seis", () => {
    expect(categoriasAtendidas(servico(1, "A", true, [preco(99, 5000)])).every((c) => c.atende)).toBe(true);
  });
});

describe("resumoDeTempos", () => {
  it("duração única com tempo grátis", () => {
    expect(resumoDeTempos({ ...servico(1, "A", true, [preco(1, 2000)]), duracaoMinutos: 60, tempoPermitidoMinutos: 120 })).toBe("1 h · até 2 h grátis");
  });

  it("faixa de duração por categoria e permanência cobrada", () => {
    const s = servico(1, "A", true, [
      { ...preco(1, 2000), duracaoMinutos: 30 },
      { ...preco(3, 7000), duracaoMinutos: 90 },
    ]);
    expect(resumoDeTempos(s)).toBe("30 min a 1 h 30 min · cobra permanência");
  });

  it("sem duração prevista, só a permanência", () => {
    expect(resumoDeTempos(servico(1, "A", true, [preco(1, 2000)]))).toBe("cobra permanência");
  });
});

describe("resumirCatalogo", () => {
  it("conta só os ativos e os que têm tempo grátis", () => {
    const lista = [
      { ...servico(1, "A", true, [preco(1, 2000)]), tempoPermitidoMinutos: 60 },
      servico(2, "B", true, [preco(1, 2000)]),
      { ...servico(3, "C", false, [preco(1, 2000)]), tempoPermitidoMinutos: 60 },
    ];
    expect(resumirCatalogo(lista)).toEqual({ ativos: 2, comTempoGratis: 1 });
  });
});
