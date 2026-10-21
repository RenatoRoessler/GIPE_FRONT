import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../client", () => ({ api: { get: vi.fn(), post: vi.fn() } }));

import { api } from "../client";
import { ApiError } from "../errors";
import { aceitarContrato, classifyContratoError, consultarContratoCliente, ContratoError } from "./contrato";
import { getContratoMensalista, reenviarContrato } from "./mensalista";

function erro(status: number, message: string, code?: string) {
  const kind = status === 429 ? "rate_limited" : status === 404 ? "not_found" : "validation";
  return new ApiError(kind, message, status, code ? [{ code, message }] : undefined);
}

describe("classifyContratoError", () => {
  it.each([
    [erro(429, "Muitas tentativas"), "rate-limited"],
    [erro(404, "Contrato não encontrado."), "invalido"],
    [erro(400, "Token inválido."), "invalido"],
    [erro(400, "Link expirado."), "vencido"],
    [erro(400, "O link do contrato venceu."), "vencido"],
    [erro(400, "Contrato já aceito."), "ja-aceito"],
    [erro(400, "O documento informado não confere."), "documento"],
    [erro(400, "Informe o CPF ou CNPJ."), "documento"],
    [erro(400, "Qualquer outra regra", "BUSINESS_ERROR"), "invalido"],
    [erro(400, "Falha", "TOKEN_EXPIRADO"), "vencido"],
  ] as const)("%o -> %s", (error, esperado) => {
    expect(classifyContratoError(error)).toBe(esperado);
  });

  it("não classifica falhas de rede ou servidor", () => {
    expect(classifyContratoError(new ApiError("network"))).toBeNull();
    expect(classifyContratoError(new ApiError("server", undefined, 500))).toBeNull();
  });
});

describe("consultarContratoCliente", () => {
  beforeEach(() => vi.clearAllMocks());

  it("consulta pelo token e devolve o contrato tolerante a campos ausentes", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { razaoSocial: "Estac. Central", nomeMensalista: "Maria", versao: 3, titulo: "Contrato", conteudo: "A\nB", hash: "abc", status: 0 },
    });
    await expect(consultarContratoCliente("ABCDE12345")).resolves.toEqual({
      razaoSocial: "Estac. Central",
      nomeMensalista: "Maria",
      versao: "3",
      titulo: "Contrato",
      conteudo: "A\nB",
      hash: "abc",
      status: 0,
      tokenExpiracao: null,
      dataAceite: null,
    });
    expect(api.get).toHaveBeenCalledWith("/Mensalista/contrato/cliente", { params: { token: "ABCDE12345" } });
  });

  it("classifica os erros conhecidos como ContratoError", async () => {
    vi.mocked(api.get).mockRejectedValue(erro(400, "Token inválido."));
    await expect(consultarContratoCliente("X")).rejects.toMatchObject({ contratoKind: "invalido", status: 400 });
    vi.mocked(api.get).mockRejectedValue(erro(429, "Muitas consultas"));
    const falha = await consultarContratoCliente("X").catch((e: unknown) => e);
    expect(falha).toBeInstanceOf(ContratoError);
    expect((falha as ContratoError).contratoKind).toBe("rate-limited");
  });

  it("propaga erros de rede sem classificar", async () => {
    vi.mocked(api.get).mockRejectedValue(new ApiError("network"));
    const falha = await consultarContratoCliente("X").catch((e: unknown) => e);
    expect(falha).not.toBeInstanceOf(ContratoError);
    expect(falha).toMatchObject({ kind: "network" });
  });
});

describe("aceitarContrato", () => {
  beforeEach(() => vi.clearAllMocks());

  it("envia o documento sem máscara", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { dataAceite: "2026-10-21T14:32:00", hash: "abc" } });
    await expect(aceitarContrato("ABCDE12345", "529.982.247-25")).resolves.toEqual({
      dataAceite: "2026-10-21T14:32:00",
      hash: "abc",
    });
    expect(api.post).toHaveBeenCalledWith("/Mensalista/contrato/cliente/aceitar", {
      token: "ABCDE12345",
      documento: "52998224725",
    });
  });

  it("mantém CNPJ alfanumérico em maiúsculas", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { dataAceite: "x", hash: "y" } });
    await aceitarContrato("ABCDE12345", "12.abc.345/01de-35");
    expect(api.post).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ documento: "12ABC34501DE35" }));
  });

  it("classifica documento que não confere", async () => {
    vi.mocked(api.post).mockRejectedValue(erro(400, "Documento não confere com o do cadastro."));
    await expect(aceitarContrato("T", "1")).rejects.toMatchObject({ contratoKind: "documento" });
  });
});

describe("contrato do operador", () => {
  beforeEach(() => vi.clearAllMocks());

  it("getContratoMensalista devolve os campos usados na tela", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { status: 1, versao: "2", titulo: "Contrato", conteudo: "texto", hash: "h", dataAceite: "2026-10-20T10:00:00", tokenExpiracao: "2026-10-27T10:00:00" },
    });
    await expect(getContratoMensalista(7)).resolves.toEqual({
      status: 1,
      versao: "2",
      titulo: "Contrato",
      dataGeracao: null,
      tokenExpiracao: "2026-10-27T10:00:00",
      dataAceite: "2026-10-20T10:00:00",
    });
    expect(api.get).toHaveBeenCalledWith("/Mensalista/7/contrato");
  });

  it("getContratoMensalista devolve null quando o mensalista não tem contrato (404)", async () => {
    vi.mocked(api.get).mockRejectedValue(new ApiError("not_found", undefined, 404));
    await expect(getContratoMensalista(7)).resolves.toBeNull();
  });

  it("getContratoMensalista propaga os demais erros", async () => {
    vi.mocked(api.get).mockRejectedValue(new ApiError("forbidden", undefined, 403));
    await expect(getContratoMensalista(7)).rejects.toMatchObject({ kind: "forbidden" });
  });

  it("reenviarContrato devolve o e-mail e a nova validade", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { tokenExpiracao: "2026-10-28T10:00:00", email: "maria@exemplo.com" } });
    await expect(reenviarContrato(7)).resolves.toEqual({ tokenExpiracao: "2026-10-28T10:00:00", email: "maria@exemplo.com" });
    expect(api.post).toHaveBeenCalledWith("/Mensalista/7/contrato/reenviar");
  });
});
