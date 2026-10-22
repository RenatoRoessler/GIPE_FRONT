import { describe, expect, it } from "vitest";
import type { PatioFiltros, PatioVeiculo } from "@/types/patio";
import {
  categoriaConhecida,
  chegadasPorHora,
  corDoVeiculo,
  estatisticasPatio,
  filtrarPatio,
  formatarMinutos,
  ocupacaoPatio,
  ordenarPatio,
  resumirPatio,
  rotuloCategoria,
} from "./patio";

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

describe("estatisticasPatio", () => {
  it("pátio vazio zera tudo, sem dividir por zero", () => {
    const stats = estatisticasPatio([]);

    expect(stats).toMatchObject({ total: 0, mensalistas: 0, percentualMensalistas: 0, mediaMinutos: 0, permanenciaLonga: 0, maisAntigo: null });
    expect(stats.porCategoria).toEqual([]);
    expect(stats.porPermanencia.every((faixa) => faixa.valor === 0)).toBe(true);
  });

  it("conta mensalistas, avulsos, percentual, média e permanência longa", () => {
    const itens = [
      veiculo({ placa: "AAA1A11", mensalista: true, minutosPermanencia: 60 }),
      veiculo({ placa: "BBB1B11", mensalista: false, minutosPermanencia: 120 }),
      veiculo({ placa: "CCC1C11", mensalista: false, minutosPermanencia: 5000 }),
    ];

    const stats = estatisticasPatio(itens);

    expect(stats).toMatchObject({ total: 3, mensalistas: 1, avulsos: 2, percentualMensalistas: 33, mediaMinutos: 1727, permanenciaLonga: 1 });
    expect(stats.maisAntigo?.placa).toBe("CCC1C11");
  });

  it("agrupa por categoria do maior para o menor, com rótulo e desempate alfabético", () => {
    const itens = [veiculo({ categoria: 3 }), veiculo({ categoria: 1 }), veiculo({ categoria: 1 }), veiculo({ categoria: 50 })];

    expect(estatisticasPatio(itens).porCategoria.map((c) => [c.rotulo, c.valor])).toEqual([
      ["Moto", 2],
      ["Carro médio", 1],
      ["Categoria 50", 1],
    ]);
  });

  it("distribui a permanência nas faixas, nos limites exatos", () => {
    const minutos = [0, 59, 60, 179, 180, 479, 480, 1439, 1440, 4319, 4320, 9000];
    const faixas = estatisticasPatio(minutos.map((m) => veiculo({ minutosPermanencia: m }))).porPermanencia;

    expect(faixas.map((f) => f.valor)).toEqual([2, 2, 2, 2, 2, 2]);
    expect(faixas.map((f) => f.longa)).toEqual([false, false, false, false, false, true]);
  });

  it("operador vazio ou nulo vira Sem operador", () => {
    const itens = [veiculo({ usuarioEntrada: null }), veiculo({ usuarioEntrada: "  " }), veiculo({ usuarioEntrada: "ana" })];

    expect(estatisticasPatio(itens).porOperador).toEqual([
      { rotulo: "Sem operador", valor: 2 },
      { rotulo: "ana", valor: 1 },
    ]);
  });
});

describe("formatarMinutos", () => {
  it("escolhe a unidade pelo tamanho", () => {
    expect(formatarMinutos(12)).toBe("12min");
    expect(formatarMinutos(185)).toBe("3h 5min");
    expect(formatarMinutos(1560)).toBe("1d 2h");
  });
});

describe("ocupacaoPatio", () => {
  const vagas = { moto: 12, carro: 23 };

  it("moto ocupa vaga de moto e as demais categorias ocupam vaga de carro", () => {
    const itens = [veiculo({ categoria: 1 }), veiculo({ categoria: 1 }), veiculo({ categoria: 2 }), veiculo({ categoria: 6 })];

    expect(ocupacaoPatio(itens, vagas)).toEqual({
      percentual: 11,
      motos: { ocupadas: 2, vagas: 12 },
      carros: { ocupadas: 2, vagas: 23 },
    });
  });

  it("pátio vazio é 0%", () => {
    expect(ocupacaoPatio([], vagas)?.percentual).toBe(0);
  });

  it("passa de 100% quando há mais veículos que vagas", () => {
    const itens = Array.from({ length: 5 }, () => veiculo({ categoria: 1 }));

    expect(ocupacaoPatio(itens, { moto: 2, carro: 2 })?.percentual).toBe(125);
  });

  it("sem vagas cadastradas devolve null", () => {
    expect(ocupacaoPatio([veiculo()], { moto: 0, carro: 0 })).toBeNull();
  });
});

describe("chegadasPorHora", () => {
  const agora = new Date(2026, 9, 22, 14, 30);
  const chegou = (dia: number, hora: number, minuto = 0) =>
    veiculo({ dataHoraEntrada: `2026-10-${dia}T${String(hora).padStart(2, "0")}:${String(minuto).padStart(2, "0")}:00` });

  it("conta só quem chegou hoje, por hora, e aponta o pico", () => {
    const chegadas = chegadasPorHora([chegou(22, 8), chegou(22, 8, 40), chegou(22, 13), chegou(21, 9)], agora);

    expect(chegadas.total).toBe(3);
    expect(chegadas.pico).toEqual({ hora: 8, valor: 2 });
    expect(chegadas.horas[0]).toEqual({ hora: 6, valor: 0 });
    expect(chegadas.horas.find((item) => item.hora === 13)?.valor).toBe(1);
  });

  it("o eixo vai das 6h às 20h e cresce com chegadas fora desse intervalo", () => {
    expect(chegadasPorHora([], agora).horas.map((item) => item.hora)).toEqual(Array.from({ length: 15 }, (_, i) => 6 + i));

    const horas = chegadasPorHora([chegou(22, 4), chegou(22, 22)], agora).horas;
    expect([horas[0].hora, horas.at(-1)?.hora]).toEqual([4, 22]);
  });

  it("sem chegadas hoje não há pico", () => {
    expect(chegadasPorHora([chegou(20, 9)], agora)).toMatchObject({ total: 0, pico: null });
  });

  it("no empate o pico é a hora mais cedo", () => {
    expect(chegadasPorHora([chegou(22, 10), chegou(22, 7)], agora).pico?.hora).toBe(7);
  });

  it("data inválida é ignorada", () => {
    expect(chegadasPorHora([veiculo({ dataHoraEntrada: "" })], agora).total).toBe(0);
  });
});
