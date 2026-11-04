import { describe, expect, it } from "vitest";
import type { VeiculoConveniada } from "@/types/patioConveniada";
import { filtrarPorEstacionamento, filtrarPorPlaca, frasePermanencia, permanenciaLonga, resumirPorEstacionamento } from "./patioConveniada";

function veiculo(parcial: Partial<VeiculoConveniada>): VeiculoConveniada {
  return {
    patioConvenioId: 1,
    empresaId: 37,
    estacionamento: "teste 2",
    placa: "OLG7Z94",
    modelo: "HB20S",
    cor: "PRATA",
    categoria: 3,
    dataEntrada: "2026-10-29T18:44:03",
    dataValidacao: "2026-10-29T18:44:24",
    usuarioIdConveniada: 37,
    usuarioConveniada: "teste login",
    rotatividadeId: 17,
    rotatividade: "convenio mercado 1",
    minutosPermanencia: 30,
    permanencia: "0h 30min",
    ...parcial,
  };
}

const lista = [
  veiculo({ patioConvenioId: 1, placa: "OLG7Z94" }),
  veiculo({ patioConvenioId: 2, placa: "TEP6I32", empresaId: 40, estacionamento: "centro" }),
  veiculo({ patioConvenioId: 3, placa: "ABC1234", empresaId: 37 }),
];

describe("resumirPorEstacionamento", () => {
  it("conta o total e cada estacionamento, na ordem em que aparecem", () => {
    expect(resumirPorEstacionamento(lista)).toEqual({
      total: 3,
      porEstacionamento: [
        { empresaId: 37, nome: "teste 2", total: 2 },
        { empresaId: 40, nome: "centro", total: 1 },
      ],
    });
  });

  it("estacionamento único e lista vazia", () => {
    expect(resumirPorEstacionamento([lista[0]]).porEstacionamento).toHaveLength(1);
    expect(resumirPorEstacionamento([])).toEqual({ total: 0, porEstacionamento: [] });
  });

  it("estacionamento sem nome ganha um nome", () => {
    expect(resumirPorEstacionamento([veiculo({ estacionamento: "" })]).porEstacionamento[0].nome).toBe("Sem nome");
  });
});

describe("filtrarPorPlaca", () => {
  it("filtra por trecho, com ou sem hífen e em qualquer caixa", () => {
    expect(filtrarPorPlaca(lista, "olg").map((v) => v.patioConvenioId)).toEqual([1]);
    expect(filtrarPorPlaca(lista, "abc-12").map((v) => v.patioConvenioId)).toEqual([3]);
    expect(filtrarPorPlaca(lista, "7z94").map((v) => v.patioConvenioId)).toEqual([1]);
  });

  it("busca vazia ou só de símbolos não filtra", () => {
    expect(filtrarPorPlaca(lista, "")).toBe(lista);
    expect(filtrarPorPlaca(lista, " - ")).toBe(lista);
  });

  it("sem correspondência devolve lista vazia", () => {
    expect(filtrarPorPlaca(lista, "ZZZ")).toEqual([]);
  });
});

describe("filtrarPorEstacionamento", () => {
  it("filtra pelo id e `null` devolve tudo", () => {
    expect(filtrarPorEstacionamento(lista, 40).map((v) => v.patioConvenioId)).toEqual([2]);
    expect(filtrarPorEstacionamento(lista, null)).toBe(lista);
    expect(filtrarPorEstacionamento(lista, 99)).toEqual([]);
  });
});

describe("permanenciaLonga", () => {
  it("vale a partir de 3 dias", () => {
    expect(permanenciaLonga({ minutosPermanencia: 4319 })).toBe(false);
    expect(permanenciaLonga({ minutosPermanencia: 4320 })).toBe(true);
  });
});

describe("frasePermanencia", () => {
  it("junta placa, veículo, categoria, estacionamento e tempo numa frase", () => {
    expect(frasePermanencia(veiculo({}))).toBe("OLG7Z94, HB20S prata, Carro médio, em teste 2, 0h 30min no pátio");
  });

  it("acrescenta 'mais de 3 dias' na permanência longa", () => {
    expect(frasePermanencia(veiculo({ minutosPermanencia: 8571, permanencia: "5d 22h 51min" }))).toMatch(/5d 22h 51min no pátio, mais de 3 dias$/);
  });

  it("tolera modelo, cor e estacionamento ausentes", () => {
    expect(frasePermanencia(veiculo({ modelo: "", cor: "", estacionamento: "", permanencia: "" }))).toBe("OLG7Z94, Carro médio");
  });
});
