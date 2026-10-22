import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../client", () => ({ api: { get: vi.fn(), post: vi.fn() } }));

import { api } from "../client";
import { ApiError } from "../errors";
import { fromNotaResponse, listNotasLancadas, listNotasPendentes, solicitarNotaFiscal, toSolicitarPayload } from "./notaFiscal";

describe("fromNotaResponse", () => {
  it("lê os campos conhecidos", () => {
    expect(
      fromNotaResponse({
        notaFiscalId: 7,
        valor: 15100,
        dataSolicitacao: "2026-10-22T12:00:00",
        dataLancamento: "2026-10-23T09:00:00",
        documento: "52998224725",
        email: "maria@exemplo.com",
        placa: "HZB5188",
      }),
    ).toEqual({
      notaFiscalId: 7,
      valor: 15100,
      dataSolicitacao: "2026-10-22T12:00:00",
      dataLancamento: "2026-10-23T09:00:00",
      documento: "52998224725",
      email: "maria@exemplo.com",
      placa: "HZB5188",
    });
  });

  it("campos ausentes, vazios ou de tipo errado viram nulo, nunca o texto \"null\"", () => {
    const nota = fromNotaResponse({ notaFiscalId: "7", valor: "10", email: "  ", documento: null });
    expect(nota).toEqual({
      notaFiscalId: null,
      valor: null,
      dataSolicitacao: null,
      dataLancamento: null,
      documento: null,
      email: null,
      placa: null,
    });
  });
});

describe("listas de notas", () => {
  beforeEach(() => vi.clearAllMocks());

  it("pendentes: GET /nota-fiscal/pendentes, aceitando a lista direta", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [{ notaFiscalId: 1, valor: 10 }, { notaFiscalId: 2, valor: 20 }] });
    const notas = await listNotasPendentes();

    expect(api.get).toHaveBeenCalledWith("/nota-fiscal/pendentes");
    expect(notas.map((nota) => nota.notaFiscalId)).toEqual([1, 2]);
  });

  it("aceita a lista dentro de um envelope e ignora itens que não são objetos", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { itens: [{ notaFiscalId: 3 }, null, "x"] } });
    const notas = await listNotasPendentes();
    expect(notas).toHaveLength(1);
    expect(notas[0].notaFiscalId).toBe(3);
  });

  it("resposta vazia ou estranha vira lista vazia", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: null });
    await expect(listNotasPendentes()).resolves.toEqual([]);
    vi.mocked(api.get).mockResolvedValue({ data: { outra: "coisa" } });
    await expect(listNotasPendentes()).resolves.toEqual([]);
  });

  it("lançadas: GET /nota-fiscal/lancadas com as datas no formato do contrato", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });
    await listNotasLancadas({ de: "2026-10-01", ate: "2026-10-23" });

    expect(api.get).toHaveBeenCalledWith("/nota-fiscal/lancadas", {
      params: { dataInicio: "2026/10/01", dataFim: "2026/10/23" },
    });
  });

  it("propaga os erros, como 403 e falha de rede", async () => {
    vi.mocked(api.get).mockRejectedValue(new ApiError("forbidden", undefined, 403));
    await expect(listNotasPendentes()).rejects.toMatchObject({ kind: "forbidden" });

    vi.mocked(api.get).mockRejectedValue(new ApiError("network"));
    await expect(listNotasLancadas({ de: "2026-10-01", ate: "2026-10-23" })).rejects.toMatchObject({ kind: "network" });
  });
});

describe("toSolicitarPayload", () => {
  it("envia o documento só com os caracteres dele, sem máscara", () => {
    expect(toSolicitarPayload({ token: "ABCD1234EF", documento: "529.982.247-25", email: " maria@exemplo.com ", valor: 15100 })).toEqual({
      token: "ABCD1234EF",
      documento: "52998224725",
      email: "maria@exemplo.com",
      valor: 15100,
    });
  });

  it("sem documento, o campo nem vai no corpo", () => {
    const payload = toSolicitarPayload({ token: "ABCD1234EF", documento: "", email: "maria@exemplo.com", valor: 10 });
    expect(payload).not.toHaveProperty("documento");
  });

  it("limita o valor a 2 casas", () => {
    expect(toSolicitarPayload({ token: "T", documento: "", email: "a@b.co", valor: 12.345 }).valor).toBe(12.35);
    expect(toSolicitarPayload({ token: "T", documento: "", email: "a@b.co", valor: 0.1 + 0.2 }).valor).toBe(0.3);
  });
});

describe("solicitarNotaFiscal", () => {
  beforeEach(() => vi.clearAllMocks());

  it("POST /nota-fiscal/cliente/solicitar e devolve a resposta do contrato", async () => {
    const resposta = { notaFiscalId: 9, valor: 15100, dataSolicitacao: "2026-10-23T10:00:00" };
    vi.mocked(api.post).mockResolvedValue({ data: resposta });

    await expect(solicitarNotaFiscal({ token: "ABCD1234EF", documento: "", email: "maria@exemplo.com", valor: 15100 })).resolves.toEqual(resposta);
    expect(api.post).toHaveBeenCalledWith("/nota-fiscal/cliente/solicitar", {
      token: "ABCD1234EF",
      email: "maria@exemplo.com",
      valor: 15100,
    });
  });

  it("propaga os erros do back (limite de tentativas, validação)", async () => {
    vi.mocked(api.post).mockRejectedValue(new ApiError("rate_limited", undefined, 429));
    await expect(solicitarNotaFiscal({ token: "T", documento: "", email: "a@b.co", valor: 1 })).rejects.toMatchObject({ kind: "rate_limited" });

    vi.mocked(api.post).mockRejectedValue(new ApiError("validation", "O valor deve ser igual ao do recibo.", 400));
    await expect(solicitarNotaFiscal({ token: "T", documento: "", email: "a@b.co", valor: 1 })).rejects.toMatchObject({
      kind: "validation",
      message: "O valor deve ser igual ao do recibo.",
    });
  });
});
