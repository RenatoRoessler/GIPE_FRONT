import { beforeEach, describe, expect, it, vi } from "vitest";
import { METODO_CONFERENCIA, MOTIVO_SAIDA, ORIGEM_ITEM, SITUACAO_ITEM } from "@/types/conferenciaPatio";

vi.mock("../client", () => ({ api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }));

import { api } from "../client";
import { ApiError } from "../errors";
import {
  conferenciaAberta,
  conferenciaFinalizada,
  itemPendente,
  leituraSemEntrada,
  resumoComUltima,
} from "./conferenciaPatio.fixture";
import {
  darSaidaPeloItem,
  descartarSemEntrada,
  finalizarConferencia,
  iniciarConferencia,
  lerPlaca,
  marcarItem,
  obterAberta,
  obterResumo,
  registrarEntradaSemTicket,
} from "./conferenciaPatio";

beforeEach(() => vi.clearAllMocks());

describe("obterResumo", () => {
  it("lê o resumo", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: resumoComUltima });
    await expect(obterResumo()).resolves.toMatchObject({ totalVeiculos: 24, caixaIdAberto: 4 });
    expect(api.get).toHaveBeenCalledWith("/conferencia-patio/resumo");
  });

  it("propaga o 403", async () => {
    vi.mocked(api.get).mockRejectedValue(new ApiError("forbidden", undefined, 403));
    await expect(obterResumo()).rejects.toMatchObject({ kind: "forbidden" });
  });
});

describe("obterAberta", () => {
  it("lê a conferência em andamento", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: conferenciaAberta });
    await expect(obterAberta()).resolves.toMatchObject({ patioConferenciaId: 1, itens: expect.any(Array) });
    expect(api.get).toHaveBeenCalledWith("/conferencia-patio/aberta");
  });

  it.each([[""], [null], [undefined]])("204 (corpo %j) vira nulo", async (data) => {
    vi.mocked(api.get).mockResolvedValue({ data });
    await expect(obterAberta()).resolves.toBeNull();
  });
});

describe("iniciarConferencia", () => {
  it("envia o método", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: conferenciaAberta });
    await expect(iniciarConferencia(METODO_CONFERENCIA.Lista)).resolves.toMatchObject({ patioConferenciaId: 1, metodo: 2 });
    expect(api.post).toHaveBeenCalledWith("/conferencia-patio", { metodo: 2 });
  });

  it("propaga o 400 (sem caixa ou já aberta)", async () => {
    vi.mocked(api.post).mockRejectedValue(new ApiError("validation", "Já existe uma conferência aberta.", 400));
    await expect(iniciarConferencia(METODO_CONFERENCIA.Camera)).rejects.toMatchObject({ kind: "validation", message: "Já existe uma conferência aberta." });
  });
});

describe("lerPlaca", () => {
  it("envia a placa normalizada e a origem", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: leituraSemEntrada });
    const leitura = await lerPlaca(1, { placa: "zzz-9z99", origem: ORIGEM_ITEM.Manual });
    expect(api.post).toHaveBeenCalledWith("/conferencia-patio/1/leituras", { placa: "ZZZ9Z99", origem: 2 });
    expect(leitura).toMatchObject({ resultado: 3, item: null, semEntrada: { placa: "ZZZ9Z99" } });
  });

  it("propaga o 404 de conferência encerrada", async () => {
    vi.mocked(api.post).mockRejectedValue(new ApiError("not_found", undefined, 404));
    await expect(lerPlaca(1, { placa: "AAA1A11", origem: ORIGEM_ITEM.Camera })).rejects.toMatchObject({ kind: "not_found" });
  });
});

describe("marcarItem", () => {
  it("envia a situação e devolve o item", async () => {
    vi.mocked(api.put).mockResolvedValue({ data: { ...itemPendente, situacao: 3 } });
    const item = await marcarItem(1, 15, SITUACAO_ITEM.NaoEncontrado);
    expect(api.put).toHaveBeenCalledWith("/conferencia-patio/1/itens/15", { situacao: 3 });
    expect(item).toMatchObject({ patioConferenciaItemId: 1, situacao: 3 });
  });

  it("resposta sem item é erro", async () => {
    vi.mocked(api.put).mockResolvedValue({ data: "" });
    await expect(marcarItem(1, 15, SITUACAO_ITEM.Pendente)).rejects.toThrow();
  });
});

describe("darSaidaPeloItem", () => {
  it("envia valor, forma e motivo", async () => {
    const saida = { patioId: 12, placa: "AAA1A11", valor: 10, formaPagamento: 1 };
    vi.mocked(api.post).mockResolvedValue({ data: saida });
    const payload = { valor: 10, formaPagamento: 1, motivo: MOTIVO_SAIDA.Outro, descricao: "Saiu na troca de turno" };
    await expect(darSaidaPeloItem(1, 15, payload)).resolves.toEqual(saida);
    expect(api.post).toHaveBeenCalledWith("/conferencia-patio/1/itens/15/saida", payload);
  });
});

describe("registrarEntradaSemTicket", () => {
  it("envia os dados na rota da placa normalizada", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { patioId: 5 } });
    const payload = { categoria: 3, modelo: "Gol", cor: "PRATA", mensalista: false };
    await registrarEntradaSemTicket(1, "zzz-9z99", payload);
    expect(api.post).toHaveBeenCalledWith("/conferencia-patio/1/sem-entrada/ZZZ9Z99/entrada", payload);
  });

  it("propaga o 400 do mensalista recusado", async () => {
    vi.mocked(api.post).mockRejectedValue(new ApiError("validation", "Mensalista com atraso acima da tolerância.", 400));
    await expect(registrarEntradaSemTicket(1, "ZZZ9Z99", { categoria: 3, modelo: "Gol", cor: "PRATA", mensalista: true })).rejects.toMatchObject({
      message: "Mensalista com atraso acima da tolerância.",
    });
  });
});

describe("descartarSemEntrada", () => {
  it("chama o DELETE da placa normalizada", async () => {
    vi.mocked(api.delete).mockResolvedValue({ data: "" });
    await expect(descartarSemEntrada(1, "zzz-9z99")).resolves.toBeUndefined();
    expect(api.delete).toHaveBeenCalledWith("/conferencia-patio/1/sem-entrada/ZZZ9Z99");
  });
});

describe("finalizarConferencia", () => {
  beforeEach(() => vi.mocked(api.post).mockResolvedValue({ data: conferenciaFinalizada }));

  it("envia a observação sem espaços nas pontas", async () => {
    await expect(finalizarConferencia(1, "  Tudo certo  ")).resolves.toMatchObject({ situacao: 2, usuarioFim: "Operador Teste" });
    expect(api.post).toHaveBeenCalledWith("/conferencia-patio/1/finalizar", { observacao: "Tudo certo" });
  });

  it("sem observação, envia o corpo vazio", async () => {
    await finalizarConferencia(1, "   ");
    expect(api.post).toHaveBeenCalledWith("/conferencia-patio/1/finalizar", {});
  });
});
