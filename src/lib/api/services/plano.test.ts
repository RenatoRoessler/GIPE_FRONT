import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../client", () => ({ api: { get: vi.fn() } }));

import { api } from "../client";
import { ApiError } from "../errors";
import { listPlanos } from "./plano";

// Resposta de exemplo do back-end (docs/specs/input.md).
const TRIAL = {
  planoAdesaoId: 1,
  plano: "TESTE GRATUITO",
  tipoPeriodoPlano: 0,
  tipoPeriodoPlanoDescricao: "Trial",
  validadeDuracaoMeses: 1,
  valor: 0,
  valorPromocional: null,
  diferencaPercentual: null,
  promocaoInicio: null,
  promocaoFim: null,
  emPromocao: false,
  valorAtual: 0,
  ordemExibicao: 1,
};

const MENSAL = {
  planoAdesaoId: 2,
  plano: "MENSAL",
  tipoPeriodoPlano: 1,
  tipoPeriodoPlanoDescricao: "Mensal",
  validadeDuracaoMeses: 1,
  valor: 99.9,
  valorPromocional: 69.9,
  diferencaPercentual: null,
  promocaoInicio: "2026-11-01T00:00:00",
  promocaoFim: "2027-06-30T00:00:00",
  emPromocao: true,
  valorAtual: 69.9,
  ordemExibicao: 2,
};

describe("listPlanos", () => {
  beforeEach(() => vi.clearAllMocks());

  it("busca em /Plano repassando o sinal de cancelamento", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [TRIAL, MENSAL] });
    const signal = new AbortController().signal;
    await listPlanos(signal);
    expect(api.get).toHaveBeenCalledWith("/Plano", { signal });
  });

  it("devolve Trial e Mensal mapeados", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [TRIAL, MENSAL] });
    const planos = await listPlanos();
    expect(planos).toHaveLength(2);
    expect(planos[0]).toMatchObject({ tipo: 0, nome: "Teste gratuito", centavosAtual: 0, emPromocao: false });
    expect(planos[1]).toMatchObject({
      tipo: 1,
      nome: "Mensal",
      centavosTabela: 9990,
      centavosAtual: 6990,
      emPromocao: true,
      promocaoAte: "2027-06-30",
    });
  });

  it("ordena por ordemExibicao", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [MENSAL, TRIAL] });
    const planos = await listPlanos();
    expect(planos.map((plano) => plano.tipo)).toEqual([0, 1]);
  });

  it("descarta o item inválido sem derrubar os demais", async () => {
    const invalido = { ...MENSAL, planoAdesaoId: 3, valorAtual: undefined };
    vi.mocked(api.get).mockResolvedValue({ data: [TRIAL, invalido, MENSAL] });
    const planos = await listPlanos();
    expect(planos.map((plano) => plano.id)).toEqual([1, 2]);
  });

  it("falha com ApiError quando a lista vem vazia", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });
    await expect(listPlanos()).rejects.toBeInstanceOf(ApiError);
  });

  it("falha com ApiError quando nenhum item é válido ou a resposta não é uma lista", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [{ lixo: true }] });
    await expect(listPlanos()).rejects.toBeInstanceOf(ApiError);
    vi.mocked(api.get).mockResolvedValue({ data: { erro: true } });
    await expect(listPlanos()).rejects.toBeInstanceOf(ApiError);
  });

  it("propaga o erro de rede", async () => {
    vi.mocked(api.get).mockRejectedValue(new ApiError("network"));
    await expect(listPlanos()).rejects.toMatchObject({ kind: "network" });
  });
});
