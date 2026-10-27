import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../errors";

vi.mock("../client", () => ({ api: { get: vi.fn() } }));

import { api } from "../client";
import { fromPatioResponse, listPatio } from "./patio";

// Dados fictícios com os mesmos campos da API.
const completo = {
  patioId: 54,
  placa: "MNB7880",
  categoria: 1,
  codigoTicket: null,
  sequencial: 2464,
  token: "ABCD1234",
  mensalista: false,
  modelo: "Gol",
  cor: "PRATA",
  dataHoraEntrada: "2026-10-20T16:41:52.398868",
  minutosPermanencia: 1469,
  permanencia: "1d 0h 29min",
  rotatividadeId: 13,
  rotatividadeDescricao: "TABELA MOTOS",
  usuarioIdEntrada: 26,
  usuarioEntrada: "operador teste",
  quadroChaves: null,
};

describe("fromPatioResponse", () => {
  it("mapeia os campos do veículo", () => {
    expect(fromPatioResponse(completo)).toEqual({
      patioId: 54,
      placa: "MNB7880",
      categoria: 1,
      modelo: "Gol",
      cor: "PRATA",
      codigoTicket: null,
      sequencial: 2464,
      mensalista: false,
      dataHoraEntrada: "2026-10-20T16:41:52.398868",
      minutosPermanencia: 1469,
      permanencia: "1d 0h 29min",
      rotatividadeDescricao: "TABELA MOTOS",
      usuarioEntrada: "operador teste",
      token: "ABCD1234",
      posicaoChave: null,
      chaveRef: null,
    });
  });

  it("não lê o id do operador nem repassa o campo cru do quadro", () => {
    const veiculo = fromPatioResponse({ ...completo, quadroChaves: "A-12" });

    expect(veiculo).not.toHaveProperty("quadroChaves");
    expect(veiculo).not.toHaveProperty("usuarioIdEntrada");
  });

  it("lê a posição da chave quando vem como texto", () => {
    expect(fromPatioResponse({ ...completo, quadroChaves: " A2 " }).posicaoChave).toBe("A2");
  });

  it("lê a posição da chave quando vem como objeto, com ou sem o nome do quadro", () => {
    expect(fromPatioResponse({ ...completo, quadroChaves: { linha: "A", coluna: 2 } }).posicaoChave).toBe("A2");
    expect(fromPatioResponse({ ...completo, quadroChaves: { quadro: "Recepção", linha: "B", coluna: 1 } }).posicaoChave).toBe(
      "Recepção · B1",
    );
  });

  it("lê a posição em partes de texto e de objeto, com a linha em maiúsculas", () => {
    expect(fromPatioResponse({ ...completo, quadroChaves: "A2" }).chaveRef).toEqual({ quadro: null, linha: "A", coluna: 2 });
    expect(fromPatioResponse({ ...completo, quadroChaves: "Recepção · b10" }).chaveRef).toEqual({
      quadro: "Recepção",
      linha: "B",
      coluna: 10,
    });
    expect(fromPatioResponse({ ...completo, quadroChaves: { nome: "Garagem", linha: "c", coluna: 3 } }).chaveRef).toEqual({
      quadro: "Garagem",
      linha: "C",
      coluna: 3,
    });
  });

  it("lê o formato real do back: posição, quadro e ids", () => {
    const veiculo = fromPatioResponse({
      ...completo,
      quadroChaves: { quadroChaveId: 49, posicao: "B2", patioQuadroId: 6, quadro: "Quadro 1" },
    });
    expect(veiculo.posicaoChave).toBe("Quadro 1 · B2");
    expect(veiculo.chaveRef).toEqual({ quadro: "Quadro 1", linha: "B", coluna: 2, patioQuadroId: 6, patioQuadroChaveId: 49 });
  });

  it("texto fora do formato mantém o texto do card mas não tem posição em partes", () => {
    const veiculo = fromPatioResponse({ ...completo, quadroChaves: "A-12" });
    expect(veiculo.posicaoChave).toBe("A-12");
    expect(veiculo.chaveRef).toBeNull();
  });

  it("sem posição, vazia ou em formato desconhecido a posição da chave é null", () => {
    for (const quadroChaves of [undefined, null, "", "  ", 5, { linha: "A" }, {}]) {
      const veiculo = fromPatioResponse({ ...completo, quadroChaves });
      expect(veiculo.posicaoChave).toBeNull();
      expect(veiculo.chaveRef).toBeNull();
    }
  });

  it("modelo e cor nulos, vazios ou só com espaços viram null", () => {
    expect(fromPatioResponse({ ...completo, modelo: null, cor: null })).toMatchObject({ modelo: null, cor: null });
    expect(fromPatioResponse({ ...completo, modelo: "", cor: "   " })).toMatchObject({ modelo: null, cor: null });
  });

  it("o ticket aceita número, texto numérico e nulo", () => {
    expect(fromPatioResponse({ ...completo, codigoTicket: 24024 }).codigoTicket).toBe(24024);
    expect(fromPatioResponse({ ...completo, codigoTicket: "24024" }).codigoTicket).toBe(24024);
    expect(fromPatioResponse({ ...completo, codigoTicket: null }).codigoTicket).toBeNull();
    expect(fromPatioResponse({ ...completo, codigoTicket: "abc" }).codigoTicket).toBeNull();
  });

  it("normaliza a placa (hífen, minúsculas)", () => {
    expect(fromPatioResponse({ ...completo, placa: "abc-1d23" }).placa).toBe("ABC1D23");
  });

  it("token vazio ou ausente vira null", () => {
    expect(fromPatioResponse({ ...completo, token: "" }).token).toBeNull();
    const semToken = Object.fromEntries(Object.entries(completo).filter(([campo]) => campo !== "token"));
    expect(fromPatioResponse(semToken).token).toBeNull();
  });

  it("mensalista só é verdadeiro quando vem true", () => {
    expect(fromPatioResponse({ ...completo, mensalista: true }).mensalista).toBe(true);
    expect(fromPatioResponse({ ...completo, mensalista: "true" }).mensalista).toBe(false);
    expect(fromPatioResponse({ ...completo, mensalista: undefined }).mensalista).toBe(false);
  });

  it("campos fora do formato viram valores neutros, sem lançar", () => {
    expect(fromPatioResponse({})).toEqual({
      patioId: 0,
      placa: "",
      categoria: 0,
      modelo: null,
      cor: null,
      codigoTicket: null,
      sequencial: 0,
      mensalista: false,
      dataHoraEntrada: "",
      minutosPermanencia: 0,
      permanencia: "",
      rotatividadeDescricao: null,
      usuarioEntrada: null,
      token: null,
      posicaoChave: null,
      chaveRef: null,
    });
  });
});

describe("listPatio", () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset();
  });

  it("chama GET /Patio e mapeia a lista", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [completo, { ...completo, patioId: 55, placa: "kvn-1f76" }] });

    const lista = await listPatio();

    expect(api.get).toHaveBeenCalledWith("/Patio");
    expect(lista.map((v) => [v.patioId, v.placa])).toEqual([
      [54, "MNB7880"],
      [55, "KVN1F76"],
    ]);
  });

  it("pátio vazio devolve lista vazia", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    expect(await listPatio()).toEqual([]);
  });

  it("resposta que não é lista vira lista vazia", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { items: [] } });
    expect(await listPatio()).toEqual([]);

    vi.mocked(api.get).mockResolvedValue({ data: null });
    expect(await listPatio()).toEqual([]);
  });

  it("ignora itens que não são objetos", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [null, "texto", 7, completo] });

    expect(await listPatio()).toHaveLength(1);
  });

  it("o erro da API sobe como ApiError", async () => {
    vi.mocked(api.get).mockRejectedValue(new ApiError("forbidden", undefined, 403));

    await expect(listPatio()).rejects.toMatchObject({ kind: "forbidden" });
  });
});
