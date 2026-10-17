import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ComprovanteCliente } from "@/types/veiculo";

vi.mock("../client", () => ({ api: { get: vi.fn(), post: vi.fn() } }));

import { api } from "../client";
import { ApiError } from "../errors";
import { consultarComprovante, resolverBuscaPorToken } from "./patio";

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
