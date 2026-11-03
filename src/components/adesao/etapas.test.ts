import { describe, expect, it } from "vitest";
import {
  ETAPA,
  MODO_ADESAO,
  etapaAnterior,
  etapaDaPosicao,
  etapasDoModo,
  posicaoDaEtapa,
  proximaEtapa,
} from "./etapas";

const { Plano, Teste } = MODO_ADESAO;

describe("etapasDoModo", () => {
  it("mantém as cinco etapas no fluxo pago", () => {
    expect(etapasDoModo(Plano)).toEqual(["Empresa", "Horários", "Titular", "Plano", "Conferir"]);
  });

  it("não tem a etapa Plano no teste grátis", () => {
    expect(etapasDoModo(Teste)).toEqual(["Empresa", "Horários", "Titular", "Conferir"]);
  });
});

describe("posicaoDaEtapa", () => {
  it("põe a Conferir na posição 5 no pago e 4 no teste", () => {
    expect(posicaoDaEtapa(ETAPA.Conferir, Plano)).toBe(5);
    expect(posicaoDaEtapa(ETAPA.Conferir, Teste)).toBe(4);
  });

  it("não muda as etapas anteriores ao plano", () => {
    for (const etapa of [ETAPA.Empresa, ETAPA.Horarios, ETAPA.Titular]) {
      expect(posicaoDaEtapa(etapa, Teste)).toBe(etapa);
      expect(posicaoDaEtapa(etapa, Plano)).toBe(etapa);
    }
  });
});

describe("etapaDaPosicao", () => {
  it("é o inverso de posicaoDaEtapa", () => {
    for (const modo of [Plano, Teste]) {
      for (let posicao = 1; posicao <= etapasDoModo(modo).length; posicao++) {
        expect(posicaoDaEtapa(etapaDaPosicao(posicao, modo), modo)).toBe(posicao);
      }
    }
  });

  it("leva a posição 4 do teste à Conferir e a do pago ao Plano", () => {
    expect(etapaDaPosicao(4, Teste)).toBe(ETAPA.Conferir);
    expect(etapaDaPosicao(4, Plano)).toBe(ETAPA.Plano);
  });
});

describe("proximaEtapa e etapaAnterior", () => {
  it("passa do Titular ao Plano no pago e à Conferir no teste", () => {
    expect(proximaEtapa(ETAPA.Titular, Plano)).toBe(ETAPA.Plano);
    expect(proximaEtapa(ETAPA.Titular, Teste)).toBe(ETAPA.Conferir);
  });

  it("volta da Conferir ao Plano no pago e ao Titular no teste", () => {
    expect(etapaAnterior(ETAPA.Conferir, Plano)).toBe(ETAPA.Plano);
    expect(etapaAnterior(ETAPA.Conferir, Teste)).toBe(ETAPA.Titular);
  });

  it("para nas pontas", () => {
    expect(proximaEtapa(ETAPA.Conferir, Teste)).toBe(ETAPA.Conferir);
    expect(etapaAnterior(ETAPA.Empresa, Plano)).toBe(ETAPA.Empresa);
  });

  it("nunca passa pela etapa Plano no teste", () => {
    let etapa: number = ETAPA.Empresa;
    const visitadas = [etapa];
    for (let i = 0; i < 6; i++) {
      etapa = proximaEtapa(etapa as 1, Teste);
      visitadas.push(etapa);
    }
    expect(visitadas).not.toContain(ETAPA.Plano);
  });
});
