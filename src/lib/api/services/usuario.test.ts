import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../client", () => ({ api: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }));

import { api } from "../client";
import { ApiError } from "../errors";
import { alterarSenha, consultarCpf, createUsuario, listUsuarios, updateAtivo, updatePerfil } from "./usuario";

const get = vi.mocked(api.get);
const post = vi.mocked(api.post);
const put = vi.mocked(api.put);

beforeEach(() => {
  vi.resetAllMocks();
});

describe("usuario service", () => {
  it("lista os usuários como array simples", async () => {
    get.mockResolvedValue({ data: [{ usuarioId: 26, nome: "renato teste", perfil: 1, ativo: true }] });
    const lista = await listUsuarios();
    expect(get).toHaveBeenCalledWith("/Usuario");
    expect(lista).toHaveLength(1);
    expect(lista[0]).toMatchObject({ usuarioId: 26, nome: "renato teste" });
  });

  it("consulta o CPF sem máscara", async () => {
    get.mockResolvedValue({ data: { encontrado: true, usuarioId: 26, vinculadoNaEmpresa: false } });
    const consulta = await consultarCpf("110.119.540-10");
    expect(get).toHaveBeenCalledWith("/Usuario/cpf/11011954010");
    expect(consulta).toMatchObject({ encontrado: true, usuarioId: 26 });
  });

  it("cria o usuário e devolve novoCadastro", async () => {
    post.mockResolvedValue({ data: { usuarioId: 3, novoCadastro: true } });
    const resultado = await createUsuario({
      cpf: "110.119.540-10",
      nome: "Maria",
      email: "maria@exemplo.com",
      celular: "(54) 99638-4949",
      perfil: "4",
    });
    expect(post).toHaveBeenCalledWith("/Usuario", {
      cpf: "11011954010",
      nome: "Maria",
      email: "maria@exemplo.com",
      celular: "54996384949",
      perfil: 4,
    });
    expect(resultado).toEqual({ usuarioId: 3, novoCadastro: true });
  });

  it("altera perfil e acesso nas rotas próprias", async () => {
    put.mockResolvedValue({ data: undefined });
    await updatePerfil(26, 2);
    await updateAtivo(26, false);
    expect(put).toHaveBeenNthCalledWith(1, "/Usuario/26/perfil", { perfil: 2 });
    expect(put).toHaveBeenNthCalledWith(2, "/Usuario/26/ativo", { ativo: false });
  });

  it("altera a senha enviando só os dois campos", async () => {
    put.mockResolvedValue({ data: undefined });
    await alterarSenha({ senhaAtual: "antiga1", novaSenha: "nova123" });
    expect(put).toHaveBeenCalledWith("/Usuario/senha", { senhaAtual: "antiga1", novaSenha: "nova123" }, undefined);
  });

  it("no primeiro acesso usa o token de troca como Bearer", async () => {
    put.mockResolvedValue({ data: undefined });
    await alterarSenha({ senhaAtual: "Temp@1234", novaSenha: "Nova@1234" }, { bearerToken: "troca" });
    expect(put).toHaveBeenCalledWith(
      "/Usuario/senha",
      { senhaAtual: "Temp@1234", novaSenha: "Nova@1234" },
      { headers: { Authorization: "Bearer troca" } },
    );
  });

  it("propaga o ApiError", async () => {
    put.mockRejectedValue(new ApiError("validation", "A empresa precisa de um Administrador ativo.", 400));
    await expect(updateAtivo(1, false)).rejects.toMatchObject({
      kind: "validation",
      message: "A empresa precisa de um Administrador ativo.",
    });
  });
});
