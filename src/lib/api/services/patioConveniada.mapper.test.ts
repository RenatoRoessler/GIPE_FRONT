import { describe, expect, it } from "vitest";
import { fromPatioConveniadaResponse } from "./patioConveniada.mapper";

const primeiro = {
  patioConvenioId: 12,
  empresaId: 37,
  estacionamento: "teste 2",
  placa: "OLG7Z94",
  modelo: "HB20S",
  cor: "PRATA",
  categoria: 3,
  dataEntrada: "2026-10-29T18:44:03.865522",
  dataValidacao: "2026-10-29T18:44:24.638665",
  usuarioIdConveniada: 37,
  usuarioConveniada: "teste login",
  rotatividadeId: 17,
  rotatividade: "convenio mercado 1",
  minutosPermanencia: 8571,
  permanencia: "5d 22h 51min",
};

const segundo = {
  ...primeiro,
  patioConvenioId: 10,
  placa: "TEP6I32",
  modelo: "Fusca",
  categoria: 2,
  dataEntrada: "2026-10-29T18:15:32.60593",
  dataValidacao: "2026-10-29T18:15:51.146021",
  minutosPermanencia: 8600,
  permanencia: "5d 23h 20min",
};

describe("fromPatioConveniadaResponse", () => {
  it("lê a lista completa, na ordem do back", () => {
    const lista = fromPatioConveniadaResponse([primeiro, segundo]);
    expect(lista).toHaveLength(2);
    expect(lista[0]).toEqual(primeiro);
    expect(lista[1]).toEqual(segundo);
  });

  it("campos ausentes e nulos viram vazios", () => {
    const [veiculo] = fromPatioConveniadaResponse([{ patioConvenioId: 3, modelo: null, categoria: null, permanencia: undefined }]);
    expect(veiculo).toMatchObject({ patioConvenioId: 3, modelo: "", categoria: 0, permanencia: "", minutosPermanencia: 0, estacionamento: "" });
  });

  it("tira os espaços das pontas dos textos", () => {
    const [veiculo] = fromPatioConveniadaResponse([{ ...primeiro, placa: " OLG7Z94 ", usuarioConveniada: " teste login " }]);
    expect(veiculo).toMatchObject({ placa: "OLG7Z94", usuarioConveniada: "teste login" });
  });

  it.each([[null], [undefined], [""], ["erro"], [{}], [42]])("resposta que não é lista (%j) vira lista vazia", (raw) => {
    expect(fromPatioConveniadaResponse(raw)).toEqual([]);
  });

  it("descarta item que não é objeto ou não tem identificador", () => {
    const lista = fromPatioConveniadaResponse([null, "x", { placa: "AAA1A11" }, primeiro]);
    expect(lista.map((item) => item.patioConvenioId)).toEqual([12]);
  });
});
