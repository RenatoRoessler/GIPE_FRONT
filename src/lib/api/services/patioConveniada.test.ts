import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../client", () => ({ api: { get: vi.fn() } }));

import { api } from "../client";
import { ApiError } from "../errors";
import { listarPatioConveniada } from "./patioConveniada";

const item = { patioConvenioId: 12, empresaId: 37, estacionamento: "teste 2", placa: "OLG7Z94", permanencia: "5d 22h 51min" };

beforeEach(() => vi.clearAllMocks());

describe("listarPatioConveniada", () => {
  it("lê a lista, sem parâmetro quando não há placa", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [item] });
    await expect(listarPatioConveniada()).resolves.toMatchObject([{ patioConvenioId: 12, placa: "OLG7Z94" }]);
    expect(api.get).toHaveBeenCalledWith("/Convenio/patio", { params: undefined });
  });

  it("envia a placa completa e válida, em maiúsculas e sem hífen", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });
    await listarPatioConveniada("olg-7z94");
    expect(api.get).toHaveBeenCalledWith("/Convenio/patio", { params: { placa: "OLG7Z94" } });
  });

  it.each([["OLG"], ["OLG-7Z"], ["1234567"], [""]])("não envia a placa %j", async (placa) => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });
    await listarPatioConveniada(placa);
    expect(api.get).toHaveBeenCalledWith("/Convenio/patio", { params: undefined });
  });

  it("resposta vazia do servidor vira lista vazia", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: "" });
    await expect(listarPatioConveniada()).resolves.toEqual([]);
  });

  it("propaga o 400 e o 403", async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new ApiError("validation", "Placa inválida.", 400));
    await expect(listarPatioConveniada("OLG7Z94")).rejects.toMatchObject({ kind: "validation", message: "Placa inválida." });
    vi.mocked(api.get).mockRejectedValueOnce(new ApiError("forbidden", undefined, 403));
    await expect(listarPatioConveniada()).rejects.toMatchObject({ kind: "forbidden" });
  });
});
