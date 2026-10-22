import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ComprovanteCliente, ReciboCliente } from "@/types/veiculo";

vi.mock("../client", () => ({ api: { get: vi.fn(), post: vi.fn() } }));

import { api } from "../client";
import { ApiError } from "../errors";
import { consultarComprovante, consultarRecibo, resolverBuscaPorToken } from "./patio";

const comprovante = { token: "227SUSYV", placa: "LWJ2686" } as ComprovanteCliente;

describe("consultarComprovante", () => {
  beforeEach(() => vi.clearAllMocks());

  it("consulta o comprovante pelo token", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: comprovante });
    await expect(consultarComprovante("227SUSYV")).resolves.toEqual(comprovante);
    expect(api.get).toHaveBeenCalledWith("/Patio/comprovante/cliente", { params: { token: "227SUSYV" } });
  });

  it.each([
    ["not_found", 404],
    ["validation", 400],
  ] as const)("converte %s em comprovante não encontrado", async (kind, status) => {
    vi.mocked(api.get).mockRejectedValue(new ApiError(kind, undefined, status));
    await expect(consultarComprovante("XXXX")).rejects.toMatchObject({ kind: "not_found", status: 404 });
  });

  it("propaga os demais erros", async () => {
    vi.mocked(api.get).mockRejectedValue(new ApiError("server", undefined, 500));
    await expect(consultarComprovante("XXXX")).rejects.toMatchObject({ kind: "server" });
  });
});

const recibo = { token: "ABCD1234EF", placa: "LWJ2686", valor: 15100 } as ReciboCliente;

describe("consultarRecibo", () => {
  beforeEach(() => vi.clearAllMocks());

  it("consulta o recibo pelo código, sem login", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: recibo });
    await expect(consultarRecibo("ABCD1234EF")).resolves.toEqual(recibo);
    expect(api.get).toHaveBeenCalledWith("/Patio/recibo/cliente", { params: { token: "ABCD1234EF" } });
  });

  it.each([
    ["not_found", 404],
    ["validation", 400],
  ] as const)("converte %s em recibo não encontrado", async (kind, status) => {
    vi.mocked(api.get).mockRejectedValue(new ApiError(kind, undefined, status));
    await expect(consultarRecibo("XXXX")).rejects.toMatchObject({ kind: "not_found", status: 404, message: "Recibo não encontrado." });
  });

  it("propaga os demais erros, como falha de rede e do servidor", async () => {
    vi.mocked(api.get).mockRejectedValue(new ApiError("server", undefined, 500));
    await expect(consultarRecibo("XXXX")).rejects.toMatchObject({ kind: "server" });

    vi.mocked(api.get).mockRejectedValue(new ApiError("network"));
    await expect(consultarRecibo("XXXX")).rejects.toMatchObject({ kind: "network" });
  });
});

describe("resolverBuscaPorToken", () => {
  beforeEach(() => vi.clearAllMocks());

  it("resolve o token em uma busca por placa", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: comprovante });
    await expect(resolverBuscaPorToken("227SUSYV")).resolves.toEqual({ tipo: "placa", valor: "LWJ2686" });
    expect(api.get).toHaveBeenCalledWith("/Patio/comprovante/cliente", { params: { token: "227SUSYV" } });
  });

  it.each([
    ["not_found", 404],
    ["validation", 400],
  ] as const)("converte %s em token sem ticket aberto", async (kind, status) => {
    vi.mocked(api.get).mockRejectedValue(new ApiError(kind, undefined, status));
    await expect(resolverBuscaPorToken("XXXX")).rejects.toMatchObject({
      kind: "not_found",
      status: 404,
      message: "Nenhum ticket aberto com este token.",
    });
  });

  it("propaga os demais erros", async () => {
    vi.mocked(api.get).mockRejectedValue(new ApiError("server", undefined, 500));
    await expect(resolverBuscaPorToken("XXXX")).rejects.toMatchObject({ kind: "server" });
  });
});
