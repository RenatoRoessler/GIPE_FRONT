import { describe, expect, it } from "vitest";
import { fromCarimboResponse } from "./carimbo.mapper";

describe("fromCarimboResponse", () => {
  it("lê a resposta completa", () => {
    expect(
      fromCarimboResponse({
        estacionamento: "teste 2",
        placa: "TEP6I32",
        modelo: "Fusca",
        cor: "PRATA",
        categoria: 2,
        dataHoraEntrada: "2026-10-29T18:15:32.60593",
        rotatividadeId: 17,
        rotatividade: "convenio mercado 1",
        dataHoraConveniada: "2026-10-29T18:15:51.1460216",
      }),
    ).toEqual({
      estacionamento: "teste 2",
      placa: "TEP6I32",
      modelo: "Fusca",
      cor: "PRATA",
      categoria: 2,
      dataHoraEntrada: "2026-10-29T18:15:32.60593",
      rotatividadeId: 17,
      rotatividade: "convenio mercado 1",
      dataHoraConveniada: "2026-10-29T18:15:51.1460216",
    });
  });

  it("tolera campos ausentes e resposta que não é objeto", () => {
    const vazio = {
      estacionamento: "",
      placa: "",
      modelo: "",
      cor: "",
      categoria: 0,
      dataHoraEntrada: "",
      rotatividadeId: 0,
      rotatividade: "",
      dataHoraConveniada: "",
    };
    expect(fromCarimboResponse({})).toEqual(vazio);
    expect(fromCarimboResponse(null)).toEqual(vazio);
    expect(fromCarimboResponse("erro")).toEqual(vazio);
  });

  it("campos nulos viram vazios e espaços nas pontas saem", () => {
    const carimbo = fromCarimboResponse({ modelo: null, placa: " TEP6I32 ", categoria: null });
    expect(carimbo).toMatchObject({ modelo: "", placa: "TEP6I32", categoria: 0 });
  });
});
