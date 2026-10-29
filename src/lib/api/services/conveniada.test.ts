import { beforeEach, describe, expect, it, vi } from "vitest";
import { EMPTY_CONVENIADA_FORM } from "@/types/conveniada";

vi.mock("../client", () => ({ api: { get: vi.fn(), post: vi.fn() } }));

import { api } from "../client";
import { ApiError } from "../errors";
import { cadastrarConveniada, listConveniadas } from "./conveniada";

const get = vi.mocked(api.get);
const post = vi.mocked(api.post);

beforeEach(() => {
  vi.resetAllMocks();
});

describe("conveniada service", () => {
  it("lista todos sem o parâmetro ativo", async () => {
    get.mockResolvedValue({ data: [{ empresaConvenioId: 1, razaoSocial: "A", ativo: true }] });
    const lista = await listConveniadas("todos");
    expect(get).toHaveBeenCalledWith("/Empresa/conveniada", undefined);
    expect(lista).toHaveLength(1);
    expect(lista[0]).toMatchObject({ empresaConvenioId: 1, razaoSocial: "A", ativo: true });
  });

  it("filtra ativos e encerrados pelo parâmetro ativo", async () => {
    get.mockResolvedValue({ data: [] });
    await listConveniadas("ativos");
    expect(get).toHaveBeenLastCalledWith("/Empresa/conveniada", { params: { ativo: true } });
    await listConveniadas("encerrados");
    expect(get).toHaveBeenLastCalledWith("/Empresa/conveniada", { params: { ativo: false } });
  });

  it("cadastra com o corpo do contrato e devolve o resultado", async () => {
    post.mockResolvedValue({
      data: { empresaConveniadaId: 3, empresaGuid: "g", novaEmpresa: true, usuarioId: 9, novoUsuario: true },
    });
    const resultado = await cadastrarConveniada({
      ...EMPTY_CONVENIADA_FORM,
      cnpj: "12.345.678/0001-95",
      razaoSocial: "Auto Peças",
      usuarioCpf: "529.982.247-25",
    });
    expect(post).toHaveBeenCalledWith(
      "/Empresa/conveniada",
      expect.objectContaining({
        empresa: expect.objectContaining({ cnpj: "12345678000195", razaoSocial: "Auto Peças" }),
        usuario: expect.objectContaining({ cpf: "52998224725" }),
      }),
    );
    expect(resultado).toEqual({ empresaConveniadaId: 3, empresaGuid: "g", novaEmpresa: true, usuarioId: 9, novoUsuario: true });
  });

  it("propaga o ApiError do cadastro", async () => {
    post.mockRejectedValue(new ApiError("validation", "Convênio já ativo.", 400));
    await expect(cadastrarConveniada(EMPTY_CONVENIADA_FORM)).rejects.toMatchObject({ message: "Convênio já ativo." });
  });
});
