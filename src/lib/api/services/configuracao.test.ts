import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../client", () => ({ api: { get: vi.fn(), put: vi.fn() } }));

import { api } from "../client";
import { ApiError } from "../errors";
import { getConfiguracao, updateConfiguracao } from "./configuracao";

describe("serviço de configuração da empresa", () => {
  beforeEach(() => vi.clearAllMocks());

  it("getConfiguracao lê GET /Configuracao", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { configuracaoId: 1, modelo: true, cor: true, prisma: false, servicos: true, entradaDiretoCamera: false, usuarioIdAlteracao: 48, dataAlteracao: "2026-11-08T16:36:03" },
    });
    const configuracao = await getConfiguracao();
    expect(api.get).toHaveBeenCalledWith("/Configuracao");
    expect(configuracao).toEqual({ modelo: true, cor: true, prisma: false, servicos: true, entradaDiretoCamera: false, alteradoPorId: 48, alteradoEm: "2026-11-08T16:36:03" });
  });

  it("getConfiguracao propaga o ApiError", async () => {
    vi.mocked(api.get).mockRejectedValue(new ApiError("forbidden"));
    await expect(getConfiguracao()).rejects.toBeInstanceOf(ApiError);
  });

  it("updateConfiguracao envia os cinco campos no PUT", async () => {
    vi.mocked(api.put).mockResolvedValue({});
    await updateConfiguracao({ modelo: true, cor: false, prisma: true, servicos: true, entradaDiretoCamera: false });
    expect(api.put).toHaveBeenCalledWith("/Configuracao", { modelo: true, cor: false, prisma: true, servicos: true, entradaDiretoCamera: false });
  });
});
