import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../client", () => ({ api: { post: vi.fn() } }));

import { api } from "../client";
import { ApiError } from "../errors";
import { login, selecionarEmpresa, trocarSenhaPrimeiroAcesso } from "./auth";

const post = vi.mocked(api.post);

beforeEach(() => {
  vi.resetAllMocks();
});

describe("login", () => {
  it("devolve a sessão quando há accessToken e envia o CPF sem máscara", async () => {
    post.mockResolvedValue({ data: { authenticated: true, accessToken: "tok" } });
    await expect(login("110.119.540-10", "Senha@123")).resolves.toEqual({ kind: "sessao", token: "tok" });
    expect(post).toHaveBeenCalledWith("/autenticacao/login", { login: "11011954010", senha: "Senha@123" });
  });

  it("devolve a troca de senha quando o back a exige", async () => {
    post.mockResolvedValue({
      data: { authenticated: true, accessToken: "", requiresPasswordChange: true, passwordChangeToken: "troca" },
    });
    await expect(login("11011954010", "temp")).resolves.toEqual({
      kind: "trocar-senha",
      passwordChangeToken: "troca",
    });
  });

  it("troca exigida sem token de troca é resposta inválida", async () => {
    post.mockResolvedValue({ data: { accessToken: "", requiresPasswordChange: true, passwordChangeToken: null } });
    await expect(login("11011954010", "temp")).rejects.toMatchObject({ kind: "unknown" });
  });

  it("sem accessToken e sem troca é resposta inválida", async () => {
    post.mockResolvedValue({ data: { accessToken: "", requiresCompanySelection: true } });
    await expect(login("11011954010", "x")).rejects.toMatchObject({ kind: "unknown" });
    post.mockResolvedValue({ data: undefined });
    await expect(login("11011954010", "x")).rejects.toMatchObject({ kind: "unknown" });
  });

  it("o 401 vira credencial inválida", async () => {
    post.mockRejectedValue(new ApiError("unauthorized", "Sessão expirada.", 401));
    await expect(login("11011954010", "x")).rejects.toMatchObject({
      kind: "unauthorized",
      message: "CPF ou senha inválidos.",
    });
  });
});

describe("trocarSenhaPrimeiroAcesso", () => {
  it("envia o passwordChangeToken no header Authorization e só a nova senha no corpo", async () => {
    post.mockResolvedValue({ data: undefined });
    await trocarSenhaPrimeiroAcesso({ passwordChangeToken: "troca", novaSenha: "Nova@1234" });
    expect(post).toHaveBeenCalledWith(
      "/autenticacao/trocar-senha",
      { novaSenha: "Nova@1234" },
      { headers: { Authorization: "Bearer troca" } },
    );
    expect(post.mock.calls[0][1]).not.toHaveProperty("passwordChangeToken");
  });

  it("propaga o ApiError", async () => {
    post.mockRejectedValue(new ApiError("unauthorized", undefined, 401));
    await expect(trocarSenhaPrimeiroAcesso({ passwordChangeToken: "x", novaSenha: "y" })).rejects.toMatchObject({ kind: "unauthorized" });
  });
});

const GUID_A = "5be38c77-bcd2-462f-a2f3-92d7a77dd48c";
const GUID_B = "0f1d9c40-7a1e-4d6b-9d3f-1a2b3c4d5e6f";

describe("login com mais de uma empresa", () => {
  const corpo = {
    authenticated: true,
    accessToken: "",
    requiresCompanySelection: true,
    preAuthToken: "pre",
    empresas: [
      { empresaGuid: GUID_A, nomeFantasia: "Central", cnpj: "11222333000181" },
      { empresaGuid: GUID_B, nomeFantasia: "Filial", cnpj: "22333444000155" },
    ],
  };

  it("devolve a escolha de empresa com o token de pré-autenticação e a lista", async () => {
    post.mockResolvedValue({ data: corpo });
    await expect(login("11011954010", "Senha@123")).resolves.toEqual({
      kind: "escolher-empresa",
      preAuthToken: "pre",
      empresas: [
        { id: GUID_A, nome: "Central", cnpj: "11222333000181", perfil: null, perfilDescricao: null },
        { id: GUID_B, nome: "Filial", cnpj: "22333444000155", perfil: null, perfilDescricao: null },
      ],
    });
  });

  it("a troca de senha vence a escolha de empresa", async () => {
    post.mockResolvedValue({ data: { ...corpo, requiresPasswordChange: true, passwordChangeToken: "troca" } });
    await expect(login("11011954010", "temp")).resolves.toEqual({ kind: "trocar-senha", passwordChangeToken: "troca" });
  });

  it("com uma só empresa a sessão vem direto, como antes", async () => {
    post.mockResolvedValue({ data: { authenticated: true, accessToken: "tok", requiresCompanySelection: false } });
    await expect(login("11011954010", "x")).resolves.toEqual({ kind: "sessao", token: "tok" });
  });

  it.each([
    ["sem token de pré-autenticação", { ...corpo, preAuthToken: "" }],
    ["sem lista de empresas", { ...corpo, empresas: undefined }],
    ["lista vazia", { ...corpo, empresas: [] }],
    ["empresa sem nome", { ...corpo, empresas: [{ empresaGuid: GUID_A }] }],
  ])("%s é resposta inválida", async (_nome, data) => {
    post.mockResolvedValue({ data });
    await expect(login("11011954010", "x")).rejects.toMatchObject({ kind: "unknown" });
  });
});

describe("selecionarEmpresa", () => {
  it("envia o preAuthToken no header Authorization e só o guid no corpo, e devolve o token da empresa", async () => {
    post.mockResolvedValue({ data: { authenticated: true, accessToken: "token-da-empresa" } });
    await expect(selecionarEmpresa({ preAuthToken: "pre", empresaGuid: GUID_A })).resolves.toBe("token-da-empresa");
    expect(post).toHaveBeenCalledWith(
      "/autenticacao/selecionar-empresa",
      { empresaGuid: GUID_A },
      { headers: { Authorization: "Bearer pre" } },
    );
    expect(post.mock.calls[0][1]).not.toHaveProperty("preAuthToken");
  });

  it("resposta sem accessToken é inválida", async () => {
    post.mockResolvedValue({ data: { authenticated: true, accessToken: "" } });
    await expect(selecionarEmpresa({ preAuthToken: "pre", empresaGuid: GUID_A })).rejects.toMatchObject({ kind: "unknown" });
  });

  it("o 401 vira escolha expirada", async () => {
    post.mockRejectedValue(new ApiError("unauthorized", "Não autorizado.", 401));
    await expect(selecionarEmpresa({ preAuthToken: "pre", empresaGuid: GUID_A })).rejects.toMatchObject({
      kind: "unauthorized",
      message: "Sua escolha expirou. Entre novamente.",
    });
  });

  it("o 429 mantém a mensagem da API", async () => {
    post.mockRejectedValue(new ApiError("rate_limited", "Muitas tentativas; aguarde.", 429));
    await expect(selecionarEmpresa({ preAuthToken: "pre", empresaGuid: GUID_A })).rejects.toMatchObject({
      kind: "rate_limited",
      message: "Muitas tentativas; aguarde.",
    });
  });
});
