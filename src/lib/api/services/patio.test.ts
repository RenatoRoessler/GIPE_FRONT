import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ComprovanteCliente } from "@/types/veiculo";

vi.mock("../client", () => ({ api: { get: vi.fn(), post: vi.fn() } }));

import { api } from "../client";
import { ApiError } from "../errors";
import { consultarComprovante } from "./patio";

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
