import { describe, expect, it } from "vitest";
import type { PatioFiltros, PatioVeiculo } from "@/types/patio";
import { categoriaConhecida, corDoVeiculo, filtrarPatio, ordenarPatio, resumirPatio, rotuloCategoria } from "./patio";

let proximoId = 1;

function veiculo(extra: Partial<PatioVeiculo> = {}): PatioVeiculo {
  return {
    patioId: proximoId++,
    placa: "ABC1D23",
    categoria: 2,
    modelo: "Gol",
    cor: "PRATA",
    codigoTicket: null,
    sequencial: 1000,
    mensalista: false,
    dataHoraEntrada: "2026-10-20T16:41:52.398868",
    minutosPermanencia: 60,
    permanencia: "1h 0min",
    rotatividadeDescricao: "TABELA",
    usuarioEntrada: "operador",
    token: "ABCD1234",
    ...extra,
  };
}

const sem: PatioFiltros = { busca: "", tipo: "todos", categoria: "todas" };
const placas = (itens: PatioVeiculo[]) => itens.map((item) => item.placa);

describe("ordenarPatio", () => {
  it("o que está há mais tempo vem primeiro, e o empate sai pela placa", () => {
    const itens = [
      veiculo({ placa: "BBB1B11", minutosPermanencia: 30 }),
      veiculo({ placa: "ZZZ9Z99", minutosPermanencia: 500 }),
      veiculo({ placa: "AAA1A11", minutosPermanencia: 30 }),
    ];

    expect(placas(ordenarPatio(itens))).toEqual(["ZZZ9Z99", "AAA1A11", "BBB1B11"]);
  });

  it("não altera a lista recebida", () => {
    const itens = [veiculo({ placa: "BBB1B11", minutosPermanencia: 1 }), veiculo({ placa: "AAA1A11", minutosPermanencia: 9 })];
    const copia = [...itens];

    ordenarPatio(itens);

    expect(itens).toEqual(copia);
  });

  it("lista vazia continua vazia", () => {
    expect(ordenarPatio([])).toEqual([]);
  });
});

describe("filtrarPatio: busca", () => {
  const itens = [
    veiculo({ placa: "ABC1D23", modelo: "Gol", sequencial: 2464, codigoTicket: 24024 }),
    veiculo({ placa: "MNB7880", modelo: "Corsa Classic", sequencial: 3830, codigoTicket: null }),
    veiculo({ placa: "KVN1F76", modelo: "Fusão Híbrido", sequencial: 5059, codigoTicket: 1 }),
  ];
  const buscar = (busca: string) => placas(filtrarPatio(itens, { ...sem, busca }));

  it("termo vazio ou só com espaços devolve tudo", () => {
    expect(buscar("")).toHaveLength(3);
    expect(buscar("   ")).toHaveLength(3);
  });

  it("acha pela placa, com ou sem hífen, em minúsculas e parcial", () => {
    expect(buscar("ABC1D23")).toEqual(["ABC1D23"]);
    expect(buscar("abc-1d23")).toEqual(["ABC1D23"]);
    expect(buscar("mnb")).toEqual(["MNB7880"]);
    expect(buscar("1D2")).toEqual(["ABC1D23"]);
  });

  it("uma letra só não basta para a placa (sem modelo para casar)", () => {
    const semModelo = [veiculo({ placa: "MNB7880", modelo: null }), veiculo({ placa: "KVN1F76", modelo: null })];

    expect(placas(filtrarPatio(semModelo, { ...sem, busca: "n" }))).toEqual([]);
    expect(placas(filtrarPatio(semModelo, { ...sem, busca: "mn" }))).toEqual(["MNB7880"]);
  });

  it("acha pelo modelo, ignorando acento e caixa", () => {
    expect(buscar("gol")).toEqual(["ABC1D23"]);
    expect(buscar("FUSAO")).toEqual(["KVN1F76"]);
    expect(buscar("hibrido")).toEqual(["KVN1F76"]);
  });

  it("várias palavras do modelo, em qualquer ordem", () => {
    expect(buscar("classic corsa")).toEqual(["MNB7880"]);
    expect(buscar("corsa gol")).toEqual([]);
  });

  it("termo só com dígitos acha o sequencial e o ticket por prefixo", () => {
    expect(buscar("2464")).toEqual(["ABC1D23"]);
    expect(buscar("24")).toEqual(["ABC1D23"]);
    expect(buscar("24024")).toEqual(["ABC1D23"]);
    expect(buscar("38")).toEqual(["MNB7880"]);
    // O ticket 1 também começa com "1".
    expect(buscar("1")).toEqual(["KVN1F76"]);
  });

  it("dígito no meio do sequencial não casa, só o prefixo", () => {
    expect(buscar("464")).toEqual([]);
  });

  it("sem resultado devolve vazio", () => {
    expect(buscar("zzzz")).toEqual([]);
  });

  it("modelo ausente não quebra a busca", () => {
    const lista = [veiculo({ placa: "XYZ9K88", modelo: null })];
    expect(placas(filtrarPatio(lista, { ...sem, busca: "gol" }))).toEqual([]);
    expect(placas(filtrarPatio(lista, { ...sem, busca: "xyz9" }))).toEqual(["XYZ9K88"]);
  });
});

describe("filtrarPatio: tipo e categoria", () => {
  const itens = [
    veiculo({ placa: "MEN1A11", mensalista: true, categoria: 1 }),
    veiculo({ placa: "AVU1A11", mensalista: false, categoria: 1 }),
    veiculo({ placa: "AVU2B22", mensalista: false, categoria: 3 }),
  ];

  it("mensalistas e avulsos", () => {
    expect(placas(filtrarPatio(itens, { ...sem, tipo: "mensalistas" }))).toEqual(["MEN1A11"]);
    expect(placas(filtrarPatio(itens, { ...sem, tipo: "avulsos" }))).toEqual(["AVU1A11", "AVU2B22"]);
    expect(filtrarPatio(itens, { ...sem, tipo: "todos" })).toHaveLength(3);
  });

  it("categoria por igualdade numérica", () => {
    expect(placas(filtrarPatio(itens, { ...sem, categoria: 3 }))).toEqual(["AVU2B22"]);
    expect(filtrarPatio(itens, { ...sem, categoria: 5 })).toEqual([]);
  });

  it("busca, tipo e categoria valem juntos", () => {
    expect(placas(filtrarPatio(itens, { busca: "avu", tipo: "avulsos", categoria: 1 }))).toEqual(["AVU1A11"]);
    expect(filtrarPatio(itens, { busca: "men", tipo: "avulsos", categoria: "todas" })).toEqual([]);
  });
});

describe("resumirPatio", () => {
  it("conta o total e os mostrados", () => {
    const todos = [veiculo(), veiculo(), veiculo()];

    expect(resumirPatio(todos, todos.slice(0, 2))).toEqual({ total: 3, mostrados: 2 });
    expect(resumirPatio([], [])).toEqual({ total: 0, mostrados: 0 });
  });
});

describe("rotuloCategoria e categoriaConhecida", () => {
  it("devolve o rótulo da categoria conhecida", () => {
    expect(rotuloCategoria(1)).toBe("Moto");
    expect(rotuloCategoria(2)).toBe("Carro pequeno");
    expect(rotuloCategoria(7)).toBe("Carro grande");
    expect(categoriaConhecida(7)).toBe(true);
  });

  it("categoria desconhecida vira Categoria N, sem quebrar", () => {
    expect(rotuloCategoria(42)).toBe("Categoria 42");
    expect(rotuloCategoria(0)).toBe("Categoria 0");
    expect(categoriaConhecida(42)).toBe(false);
  });
});

describe("corDoVeiculo", () => {
  it("cor conhecida ganha amostra, em qualquer caixa", () => {
    expect(corDoVeiculo("PRATA")).toEqual({ texto: "PRATA", amostra: "#C3C7CC" });
    expect(corDoVeiculo("verde")).toEqual({ texto: "verde", amostra: "#2E7D4F" });
  });

  it("cor livre aparece como texto, sem amostra", () => {
    expect(corDoVeiculo("teste")).toEqual({ texto: "teste", amostra: null });
    expect(corDoVeiculo("rosa")).toEqual({ texto: "rosa", amostra: null });
  });

  it("cor ausente ou vazia vira traço", () => {
    expect(corDoVeiculo(null)).toEqual({ texto: "—", amostra: null });
    expect(corDoVeiculo("")).toEqual({ texto: "—", amostra: null });
    expect(corDoVeiculo("   ")).toEqual({ texto: "—", amostra: null });
  });
});
