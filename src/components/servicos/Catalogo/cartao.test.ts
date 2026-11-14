import { describe, expect, it } from "vitest";
import type { Servico } from "@/types/servico";
import {
  categoriasQueNaoFaz,
  CATEGORIAS_NA_TELA,
  faixaDeDuracao,
  faixaDeGratis,
  faixaDePreco,
  metaDoCartaoMobile,
  pilulasDasCategorias,
  quantosTemGratis,
  tempoCurto,
  textoDaFaixaDePreco,
} from "./cartao";

const preco = (categoria: number, valorCentavos: number, duracaoMinutos: number | null = null, tempoPermitidoMinutos: number | null = null) => ({
  categoria,
  descricao: "x",
  valorCentavos,
  duracaoMinutos,
  tempoPermitidoMinutos,
});

const servico = (precos: Servico["precos"], extra: Partial<Servico> = {}): Servico => ({
  id: 1,
  nome: "Lavagem",
  descricao: null,
  duracaoMinutos: null,
  tempoPermitidoMinutos: null,
  ativo: true,
  precos,
  ...extra,
});

// Os serviços de exemplo do protótipo.
const COMPLETA = servico([
  preco(1, 3500, 30, 60),
  preco(2, 7000, 60, 120),
  preco(3, 7000, 60, 120),
  preco(6, 8500, 75, 120),
  preco(4, 9000, 90, 180),
  preco(5, 14000, 120, 180),
]);
const HIGIENIZACAO = servico([preco(2, 25000, 150, 240), preco(3, 25000, 180, 240), preco(6, 28000, 210, 300), preco(4, 30000, 240, 300)]);

describe("tempoCurto", () => {
  it("minutos, horas e horas com minutos", () => {
    expect(tempoCurto(45)).toBe("45 min");
    expect(tempoCurto(120)).toBe("2h");
    expect(tempoCurto(90)).toBe("1h30");
    expect(tempoCurto(75)).toBe("1h15");
    expect(tempoCurto(65)).toBe("1h05");
  });

  it("sem valor ou zero, vazio", () => {
    expect(tempoCurto(0)).toBe("");
    expect(tempoCurto(null)).toBe("");
    expect(tempoCurto(undefined)).toBe("");
  });
});

describe("a ordem das categorias", () => {
  it("moto, os carros por tamanho, caminhonete e caminhão", () => {
    expect([...CATEGORIAS_NA_TELA]).toEqual([1, 2, 3, 6, 4, 5]);
  });
});

describe("faixaDeDuracao", () => {
  it("do menor ao maior tempo entre as categorias", () => {
    expect(faixaDeDuracao(COMPLETA)).toBe("30 min a 2h");
    expect(faixaDeDuracao(HIGIENIZACAO)).toBe("2h30 a 4h");
  });

  it("um valor só quando todas levam o mesmo tempo", () => {
    expect(faixaDeDuracao(servico([preco(1, 1000, 30), preco(2, 2000, 30)]))).toBe("30 min");
  });

  it("sem previsão, vazio; usa o tempo do serviço onde a categoria não traz o seu", () => {
    expect(faixaDeDuracao(servico([preco(1, 1000)]))).toBe("");
    expect(faixaDeDuracao(servico([preco(1, 1000)], { duracaoMinutos: 45 }))).toBe("45 min");
  });
});

describe("faixaDeGratis", () => {
  it("do menor ao maior tempo grátis", () => {
    expect(faixaDeGratis(COMPLETA)).toBe("1h a 3h grátis no pátio");
    expect(faixaDeGratis(HIGIENIZACAO)).toBe("4h a 5h grátis no pátio");
  });

  it("'até' quando alguma categoria não tem tempo grátis", () => {
    expect(faixaDeGratis(servico([preco(1, 1000, null, null), preco(2, 2000, null, 60)]))).toBe("até 1h grátis no pátio");
  });

  it("o mesmo em todas, ou nenhum", () => {
    expect(faixaDeGratis(servico([preco(1, 1000, null, 60), preco(2, 2000, null, 60)]))).toBe("1h grátis no pátio");
    expect(faixaDeGratis(servico([preco(1, 1000), preco(2, 2000)]))).toBe("");
  });
});

describe("categoriasQueNaoFaz", () => {
  it("lista, na ordem da tela, as categorias sem preço", () => {
    expect(categoriasQueNaoFaz(HIGIENIZACAO)).toEqual(["Moto", "Caminhão"]);
    expect(categoriasQueNaoFaz(COMPLETA)).toEqual([]);
  });

  it("o preço de 'Todas' atende todas", () => {
    expect(categoriasQueNaoFaz(servico([preco(99, 5000)]))).toEqual([]);
  });
});

describe("faixa de preço", () => {
  it("por categoria: do menor ao maior, sem repetir o 'R$'", () => {
    const faixa = faixaDePreco(COMPLETA)!;
    expect(faixa).toEqual({ minimoCentavos: 3500, maximoCentavos: 14000, unico: false });
    expect(textoDaFaixaDePreco(faixa)).toBe("R$ 35,00 – 140,00");
  });

  it("preço único", () => {
    const faixa = faixaDePreco(servico([preco(1, 7000), preco(2, 7000)]))!;
    expect(faixa.unico).toBe(true);
    expect(textoDaFaixaDePreco(faixa)).toBe("R$ 70,00");
  });

  it("sem preço, nulo", () => {
    expect(faixaDePreco(servico([]))).toBeNull();
  });

  it("valores acima de mil levam o separador de milhar", () => {
    expect(textoDaFaixaDePreco({ minimoCentavos: 99900, maximoCentavos: 125050, unico: false })).toBe("R$ 999,00 – 1.250,50");
  });
});

describe("meta do cartão do celular", () => {
  it("duração e o maior tempo grátis", () => {
    expect(metaDoCartaoMobile(COMPLETA)).toBe("30 min a 2h · até 3h grátis");
  });

  it("sem tempo grátis, cobra permanência; sem previsão, só a permanência", () => {
    expect(metaDoCartaoMobile(servico([preco(1, 1000, 10), preco(2, 2000, 30)]))).toBe("10 min a 30 min · cobra permanência");
    expect(metaDoCartaoMobile(servico([preco(1, 1000)]))).toBe("cobra permanência");
  });
});

describe("pilulasDasCategorias", () => {
  it("seis pílulas na ordem da tela, com o rótulo curto, as que não atende marcadas", () => {
    const pilulas = pilulasDasCategorias(HIGIENIZACAO);
    expect(pilulas.map((pilula) => pilula.rotulo)).toEqual(["Moto", "pequeno", "médio", "grande", "Caminhonete", "Caminhão"]);
    expect(pilulas.filter((pilula) => !pilula.atende).map((pilula) => pilula.rotulo)).toEqual(["Moto", "Caminhão"]);
  });
});

describe("quantosTemGratis", () => {
  it("conta os serviços com tempo grátis em alguma categoria", () => {
    expect(quantosTemGratis([COMPLETA, HIGIENIZACAO, servico([preco(1, 1000)])])).toBe(2);
  });
});
