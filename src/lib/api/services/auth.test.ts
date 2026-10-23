import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../client", () => ({ api: { post: vi.fn() } }));

import { api } from "../client";
import { ApiError } from "../errors";
import { login, trocarSenhaPrimeiroAcesso } from "./auth";

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
