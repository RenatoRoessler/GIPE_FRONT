import { describe, expect, it } from "vitest";
import { TIPO_CATEGORIA, TIPO_REGRA, type PrecoView } from "@/types/preco";
import { estimarCobranca } from "./estimarCobranca";

function preco(extra: Partial<PrecoView> = {}): PrecoView {
  return {
    rotatividadeId: 1,
    empresaConveniadaId: null,
    descricao: "Tarifa padrão",
    tipoRegra: TIPO_REGRA.Padrao,
    inicioVigencia: "2026-06-06T00:00:00",
    fimVigencia: null,
    toleranciaEntradaMinutos: 10,
    toleranciaAlteracaoFaixaMinutos: 0,
    periodoDiaria: 720,
    valorDiaria: 35,
    valorAdicionalDiaria: 1,
    ativo: true,
    regras: [],
    faixas: [
      { minutosLimite: 30, valor: 6, percentualConveniada: null },
      { minutosLimite: 60, valor: 10, percentualConveniada: null },
      { minutosLimite: 120, valor: 16, percentualConveniada: null },
      { minutosLimite: 180, valor: 20, percentualConveniada: null },
    ],
    categorias: [TIPO_CATEGORIA.Todas],
    ...extra,
  };
}

const CARRO = TIPO_CATEGORIA.CarroMedio;

function valor(estimativa: ReturnType<typeof estimarCobranca>) {
  if (estimativa.tipo !== "valor") {
    throw new Error(`esperava valor, veio ${estimativa.tipo}`);
  }
  return estimativa;
}

describe("estimarCobranca: categoria", () => {
  it("'Todas' atende qualquer categoria", () => {
    expect(estimarCobranca(preco(), TIPO_CATEGORIA.Moto, 45).tipo).toBe("valor");
    expect(estimarCobranca(preco(), TIPO_CATEGORIA.Caminhao, 45).tipo).toBe("valor");
  });

  it("atende a categoria listada", () => {
    expect(estimarCobranca(preco({ categorias: [CARRO] }), CARRO, 45).tipo).toBe("valor");
  });

  it("não se aplica a uma categoria fora da lista", () => {
    expect(estimarCobranca(preco({ categorias: [TIPO_CATEGORIA.Moto] }), CARRO, 45)).toEqual({ tipo: "nao_aplica" });
  });

  it("não se aplica quando a tabela não tem categoria nenhuma", () => {
    expect(estimarCobranca(preco({ categorias: [] }), CARRO, 45)).toEqual({ tipo: "nao_aplica" });
  });
});

describe("estimarCobranca: tolerância de entrada", () => {
  it("dentro da tolerância não cobra", () => {
    expect(valor(estimarCobranca(preco(), CARRO, 10))).toMatchObject({
      valor: 0,
      explicacao: "Dentro da tolerância de entrada (10 min)",
    });
  });

  it("um minuto depois da tolerância já entra no primeiro degrau", () => {
    expect(valor(estimarCobranca(preco(), CARRO, 11))).toMatchObject({ valor: 6, explicacao: "Degrau até 30 min" });
  });

  it("sem permanência não cobra", () => {
    expect(valor(estimarCobranca(preco(), CARRO, 0))).toMatchObject({ valor: 0, explicacao: "Sem permanência" });
  });

  it("sem tolerância cadastrada, zero minuto continua sem cobrança", () => {
    expect(valor(estimarCobranca(preco({ toleranciaEntradaMinutos: 0 }), CARRO, 0)).valor).toBe(0);
    expect(valor(estimarCobranca(preco({ toleranciaEntradaMinutos: 0 }), CARRO, 1)).valor).toBe(6);
  });

  it("valores inválidos de permanência contam como zero", () => {
    expect(valor(estimarCobranca(preco(), CARRO, Number.NaN)).valor).toBe(0);
    expect(valor(estimarCobranca(preco(), CARRO, -5)).valor).toBe(0);
  });
});

describe("estimarCobranca: degraus", () => {
  it.each([
    [30, 6, "Degrau até 30 min"],
    [31, 10, "Degrau até 1 h"],
    [60, 10, "Degrau até 1 h"],
    [61, 16, "Degrau até 2 h"],
    [120, 16, "Degrau até 2 h"],
    [121, 20, "Degrau até 3 h"],
    [180, 20, "Degrau até 3 h"],
  ])("com %i min cobra R$ %i (%s)", (minutos, esperado, explicacao) => {
    expect(valor(estimarCobranca(preco(), CARRO, minutos))).toMatchObject({ valor: esperado, bruto: esperado, explicacao });
  });

  it("respeita os degraus mesmo desordenados", () => {
    const desordenado = preco({
      faixas: [
        { minutosLimite: 120, valor: 16, percentualConveniada: null },
        { minutosLimite: 30, valor: 6, percentualConveniada: null },
      ],
    });
    expect(valor(estimarCobranca(desordenado, CARRO, 20)).valor).toBe(6);
  });

  it("a tolerância de alteração de faixa estende o limite do degrau", () => {
    const comTolerancia = preco({ toleranciaAlteracaoFaixaMinutos: 5 });
    expect(valor(estimarCobranca(comTolerancia, CARRO, 35)).valor).toBe(6);
    expect(valor(estimarCobranca(comTolerancia, CARRO, 36)).valor).toBe(10);
  });
});

describe("estimarCobranca: diária e adicional", () => {
  it("depois do último degrau cobra a diária", () => {
    expect(valor(estimarCobranca(preco(), CARRO, 181))).toMatchObject({ valor: 35, explicacao: "Diária de 12 h" });
    expect(valor(estimarCobranca(preco(), CARRO, 720)).valor).toBe(35);
  });

  it("passando do período da diária soma o adicional por hora iniciada", () => {
    expect(valor(estimarCobranca(preco(), CARRO, 721))).toMatchObject({ valor: 36, explicacao: "Diária mais 1 h de adicional" });
    expect(valor(estimarCobranca(preco(), CARRO, 780)).valor).toBe(36);
    expect(valor(estimarCobranca(preco(), CARRO, 781)).valor).toBe(37);
    expect(valor(estimarCobranca(preco(), CARRO, 900))).toMatchObject({ valor: 38, explicacao: "Diária mais 3 h de adicional" });
  });

  it("sem adicional cadastrado, mantém só a diária e avisa", () => {
    const resultadoSemAdicional = valor(estimarCobranca(preco({ valorAdicionalDiaria: 0 }), CARRO, 900));
    expect(resultadoSemAdicional.valor).toBe(35);
    expect(resultadoSemAdicional.explicacao).toBe("Diária de 12 h, sem adicional cadastrado");
  });

  it("sem faixas e sem diária não há regra", () => {
    expect(estimarCobranca(preco({ faixas: [], valorDiaria: 0 }), CARRO, 90)).toEqual({ tipo: "sem_regra" });
    expect(estimarCobranca(preco({ valorDiaria: 0 }), CARRO, 500)).toEqual({ tipo: "sem_regra" });
  });

  it("sem faixas mas com diária cobra a diária", () => {
    expect(valor(estimarCobranca(preco({ faixas: [] }), CARRO, 90)).valor).toBe(35);
  });

  it("diária sem período cadastrado não vale", () => {
    expect(estimarCobranca(preco({ periodoDiaria: 0, faixas: [] }), CARRO, 90)).toEqual({ tipo: "sem_regra" });
  });
});

describe("estimarCobranca: desconto da conveniada", () => {
  const convenio = (extra: Partial<PrecoView> = {}) =>
    preco({
      tipoRegra: TIPO_REGRA.Convenio,
      faixas: [
        { minutosLimite: 60, valor: 10, percentualConveniada: 30 },
        { minutosLimite: 120, valor: 16.05, percentualConveniada: 10 },
        { minutosLimite: 180, valor: 20, percentualConveniada: null },
      ],
      ...extra,
    });

  it("aplica o percentual da faixa usada em tabela de convênio", () => {
    expect(valor(estimarCobranca(convenio(), CARRO, 45))).toMatchObject({
      valor: 7,
      bruto: 10,
      descontoPercentual: 30,
      explicacao: "Degrau até 1 h, com desconto de 30% da conveniada",
    });
  });

  it("arredonda em centavos", () => {
    const estimativa = valor(estimarCobranca(convenio(), CARRO, 90));
    expect(estimativa.bruto).toBe(16.05);
    expect(estimativa.valor).toBe(14.45);
    expect(estimativa.descontoPercentual).toBe(10);
  });

  it("faixa sem percentual não recebe desconto", () => {
    expect(valor(estimarCobranca(convenio(), CARRO, 150))).toMatchObject({ valor: 20, descontoPercentual: null });
  });

  it("outros tipos de regra ignoram o percentual", () => {
    const padrao = preco({ faixas: [{ minutosLimite: 60, valor: 10, percentualConveniada: 30 }] });
    expect(valor(estimarCobranca(padrao, CARRO, 45))).toMatchObject({ valor: 10, descontoPercentual: null });
  });

  it("a diária não recebe desconto", () => {
    expect(valor(estimarCobranca(convenio(), CARRO, 400))).toMatchObject({ valor: 35, descontoPercentual: null });
  });
});

describe("estimarCobranca: dinheiro em centavos", () => {
  it("não acumula erro de ponto flutuante", () => {
    const p = preco({ faixas: [{ minutosLimite: 60, valor: 0.1 + 0.2, percentualConveniada: null }] });
    expect(valor(estimarCobranca(p, CARRO, 45)).valor).toBe(0.3);
  });
});
