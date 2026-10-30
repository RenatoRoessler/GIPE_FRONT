import { describe, expect, it } from "vitest";
import { AGRUPAMENTO_FLUXO, type FluxoPeriodo } from "@/types/financeiro";
import { abreviar, alturaHaste, escala, marcasEixoX, marcasEixoY, maiorEntrada, pontosAcumulado, pontosParaSvg, posicaoY, temMovimento } from "./regua";

function periodo(data: string, entradas = 0, saidas = 0, saldoAcumulado = 0): FluxoPeriodo {
  return { data, entradas, saidas, saldo: entradas - saidas, saldoAcumulado };
}

// Dias consecutivos a partir de 1º de outubro de 2026 (outubro tem 31 dias, depois novembro).
function dias(quantidade: number, inicio = new Date(2026, 9, 1)): FluxoPeriodo[] {
  return Array.from({ length: quantidade }, (_, indice) => {
    const data = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + indice);
    const texto = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
    return periodo(texto);
  });
}

describe("escala", () => {
  it("sempre inclui o zero e considera entradas, saídas e acumulado", () => {
    expect(escala([periodo("2026-10-01", 100, 0, 100), periodo("2026-10-02", 0, 40, 60)])).toEqual({ min: -40, max: 100 });
  });

  it("com saldo negativo, o mínimo vem das saídas ou do acumulado", () => {
    expect(escala([periodo("2026-10-01", 0, 50, -50), periodo("2026-10-02", 0, 80, -130)])).toEqual({ min: -130, max: 0 });
  });

  it("sem movimento, a escala é zero", () => {
    expect(escala([periodo("2026-10-01")])).toEqual({ min: 0, max: 0 });
    expect(escala([])).toEqual({ min: 0, max: 0 });
  });
});

describe("posicaoY e alturaHaste", () => {
  const referencia = { min: -100, max: 300 };

  it("o máximo fica no topo, o mínimo na base e o zero entre eles", () => {
    expect(posicaoY(300, referencia)).toBe(0);
    expect(posicaoY(-100, referencia)).toBe(100);
    expect(posicaoY(0, referencia)).toBe(75);
  });

  it("sem variação, o zero fica no meio e as hastes não têm altura", () => {
    expect(posicaoY(0, { min: 0, max: 0 })).toBe(50);
    expect(alturaHaste(10, { min: 0, max: 0 })).toBe(0);
  });

  it("a altura da haste é proporcional à amplitude, sem sinal", () => {
    expect(alturaHaste(100, referencia)).toBe(25);
    expect(alturaHaste(-100, referencia)).toBe(25);
  });
});

describe("pontosAcumulado", () => {
  it("põe um ponto no centro de cada coluna", () => {
    const pontos = pontosAcumulado([periodo("2026-10-01", 0, 0, 0), periodo("2026-10-02", 100, 0, 100)], { min: 0, max: 100 });

    expect(pontos).toEqual([
      { x: 25, y: 100 },
      { x: 75, y: 0 },
    ]);
    expect(pontosParaSvg(pontos)).toBe("25.00,100.00 75.00,0.00");
  });
});

describe("marcasEixoX", () => {
  it("por dia, até 31 pontos: o dia 1 e os múltiplos de 5", () => {
    const rotulos = marcasEixoX(dias(31), AGRUPAMENTO_FLUXO.Dia).map((marca) => marca.rotulo);

    expect(rotulos).toEqual(["01", "05", "10", "15", "20", "25", "30"]);
  });

  it("as marcas apontam para o índice da coluna", () => {
    const marcas = marcasEixoX(dias(10), AGRUPAMENTO_FLUXO.Dia);

    expect(marcas).toEqual([
      { indice: 0, rotulo: "01" },
      { indice: 4, rotulo: "05" },
      { indice: 9, rotulo: "10" },
    ]);
  });

  it("por dia, em período longo: só o dia 1 de cada mês, com o ano no começo e em janeiro", () => {
    const rotulos = marcasEixoX(dias(120, new Date(2026, 11, 1)), AGRUPAMENTO_FLUXO.Dia).map((marca) => marca.rotulo);

    expect(rotulos).toEqual(["dez/26", "jan/27", "fev", "mar"]);
  });

  it("período longo que começa no meio do mês não marca a primeira coluna", () => {
    const rotulos = marcasEixoX(dias(60, new Date(2026, 9, 10)), AGRUPAMENTO_FLUXO.Dia).map((marca) => marca.rotulo);

    expect(rotulos).toEqual(["nov", "dez"]);
  });

  it("por mês: todos os meses", () => {
    const meses = [periodo("2026-10-01"), periodo("2026-11-01"), periodo("2026-12-01")];

    expect(marcasEixoX(meses, AGRUPAMENTO_FLUXO.Mes).map((marca) => marca.rotulo)).toEqual(["out/26", "nov/26", "dez/26"]);
  });
});

describe("marcasEixoY", () => {
  it("máximo e zero quando só há entradas", () => {
    expect(marcasEixoY({ min: 0, max: 100 })).toEqual([
      { valor: 100, posicao: 0 },
      { valor: 0, posicao: 100 },
    ]);
  });

  it("com saldo negativo, acrescenta o mínimo", () => {
    expect(marcasEixoY({ min: -100, max: 300 }).map((marca) => marca.valor)).toEqual([300, 0, -100]);
  });

  it("só saídas: zero e mínimo", () => {
    expect(marcasEixoY({ min: -50, max: 0 }).map((marca) => marca.valor)).toEqual([0, -50]);
  });

  it("sem movimento: só o zero", () => {
    expect(marcasEixoY({ min: 0, max: 0 })).toEqual([{ valor: 0, posicao: 50 }]);
  });
});

describe("abreviar", () => {
  it("encurta milhares e milhões", () => {
    expect(abreviar(75000)).toBe("R$ 75 mil");
    expect(abreviar(75110)).toBe("R$ 75,1 mil");
    expect(abreviar(1500000)).toBe("R$ 1,5 mi");
  });

  it("abaixo de mil, mostra o valor inteiro", () => {
    expect(abreviar(0)).toBe("R$ 0");
    expect(abreviar(450)).toBe("R$ 450");
  });

  it("o negativo leva o sinal −", () => {
    expect(abreviar(-2500)).toBe("− R$ 2,5 mil");
  });
});

describe("maiorEntrada e temMovimento", () => {
  it("acha o período de maior entrada", () => {
    const lista = [periodo("2026-10-01", 40), periodo("2026-10-02", 32800), periodo("2026-10-03", 18120)];

    expect(maiorEntrada(lista)?.data).toBe("2026-10-02");
  });

  it("sem entradas, não há maior", () => {
    expect(maiorEntrada([periodo("2026-10-01", 0, 20)])).toBeNull();
    expect(maiorEntrada([])).toBeNull();
  });

  it("detecta se houve alguma entrada ou saída", () => {
    expect(temMovimento([periodo("2026-10-01"), periodo("2026-10-02", 0, 5)])).toBe(true);
    expect(temMovimento([periodo("2026-10-01")])).toBe(false);
    expect(temMovimento([])).toBe(false);
  });
});
