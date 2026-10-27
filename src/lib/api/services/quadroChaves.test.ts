import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../client", () => ({ api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }));

import { api } from "../client";
import { ApiError } from "../errors";
import {
  acrescentarPosicoes,
  criarQuadro,
  escolherQuadroChave,
  excluirPosicao,
  inativarQuadro,
  listQuadros,
} from "./quadroChaves";

const get = vi.mocked(api.get);
const post = vi.mocked(api.post);
const put = vi.mocked(api.put);
const del = vi.mocked(api.delete);

const quadro = {
  patioQuadroId: 3,
  nome: "Recepção",
  linhas: [{ linha: "A", colunas: [{ patioQuadroChaveId: 15, coluna: 1, disponivel: true }] }],
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe("quadroChaves service", () => {
  it("lista os quadros ativos", async () => {
    get.mockResolvedValue({ data: [quadro] });
    expect(await listQuadros()).toEqual([quadro]);
    expect(get).toHaveBeenCalledWith("/Patio/quadro-chaves");
  });

  it("devolve lista vazia quando a resposta não é uma lista", async () => {
    get.mockResolvedValue({ data: null });
    expect(await listQuadros()).toEqual([]);
  });

  it("cria o quadro com nome e linhas", async () => {
    post.mockResolvedValue({ data: quadro });
    const payload = { nome: "Recepção", linhas: [{ linha: "A", colunas: [1] }] };
    expect(await criarQuadro(payload)).toEqual(quadro);
    expect(post).toHaveBeenCalledWith("/Patio/quadro-chaves", payload);
  });

  it("propaga o erro de validação ao criar um nome já usado", async () => {
    post.mockRejectedValue(new ApiError("validation", "Nome já usado", 400));
    await expect(criarQuadro({ nome: "Recepção", linhas: [] })).rejects.toMatchObject({ kind: "validation" });
  });

  it("acrescenta posições ao quadro pelo id", async () => {
    post.mockResolvedValue({ data: quadro });
    await acrescentarPosicoes(3, [{ linha: "C", colunas: [1, 2] }]);
    expect(post).toHaveBeenCalledWith("/Patio/quadro-chaves/3", [{ linha: "C", colunas: [1, 2] }]);
  });

  it("escolhe a posição do veículo", async () => {
    put.mockResolvedValue({
      data: { patioId: 9, placa: "FLP3C88", patioQuadroId: 3, quadro: "Recepção", patioQuadroChaveId: 15, linha: "A", coluna: 2 },
    });
    const escolhida = await escolherQuadroChave(9, 15);
    expect(put).toHaveBeenCalledWith("/Patio/9/quadro-chave", { patioQuadroChaveId: 15 });
    expect(escolhida).toMatchObject({ patioId: 9, linha: "A", coluna: 2, quadro: "Recepção" });
  });

  it("propaga o erro quando a posição está com a chave de outro veículo", async () => {
    put.mockRejectedValue(new ApiError("validation", "Posição A2 ocupada pelo veículo ABC1D23", 400));
    await expect(escolherQuadroChave(9, 15)).rejects.toThrow("ABC1D23");
  });

  it("exclui uma posição", async () => {
    del.mockResolvedValue({ data: undefined });
    await excluirPosicao(15);
    expect(del).toHaveBeenCalledWith("/Patio/quadro-chaves/15");
  });

  it("inativa um quadro e propaga o 404", async () => {
    del.mockResolvedValue({ data: undefined });
    await inativarQuadro(3);
    expect(del).toHaveBeenCalledWith("/Patio/quadro-chaves/quadro/3");
    del.mockRejectedValue(new ApiError("not_found", undefined, 404));
    await expect(inativarQuadro(3)).rejects.toMatchObject({ kind: "not_found" });
  });
});
