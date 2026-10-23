import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../client", () => ({ api: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }));

import { api } from "../client";
import { ApiError } from "../errors";
import {
  abrirCaixa,
  fecharCaixa,
  getCaixa,
  getTurnoAtual,
  listHistoricoCaixas,
  listMovimentos,
  listMovimentosCaixa,
  listTurnos,
  passarTurno,
  registrarSangria,
} from "./caixa";

const get = vi.mocked(api.get);
const post = vi.mocked(api.post);
const put = vi.mocked(api.put);

beforeEach(() => {
  vi.resetAllMocks();
});

describe("caixa service: escrita", () => {
  it("abre o caixa com o fundo", async () => {
    post.mockResolvedValue({ data: {} });
    await abrirCaixa(150);
    expect(post).toHaveBeenCalledWith("/Caixa/abrir", { valorFundoCaixa: 150 });
  });

  it("registra a sangria com valor e motivo", async () => {
    post.mockResolvedValue({ data: {} });
    await registrarSangria({ valor: 80, observacao: "Cofre" });
    expect(post).toHaveBeenCalledWith("/Caixa/sangria", { valor: 80, observacao: "Cofre" });
  });

  it("passa o turno enviando o fundo de caixa do novo turno", async () => {
    post.mockResolvedValue({ data: {} });
    await passarTurno({ conferencias: [{ formaPagamento: 1, valorInformado: 40 }], valorFundoCaixa: 100, observacao: "ok" });
    expect(post).toHaveBeenCalledWith("/Caixa/turno/passagem", {
      conferencias: [{ formaPagamento: 1, valorInformado: 40 }],
      valorFundoCaixa: 100,
      observacao: "ok",
    });
  });

  it("passa o turno com fundo nulo quando não informado", async () => {
    post.mockResolvedValue({ data: {} });
    await passarTurno({ conferencias: [], valorFundoCaixa: null });
    expect(post.mock.calls[0][1]).toMatchObject({ valorFundoCaixa: null });
    expect(post.mock.calls[0][1]).not.toHaveProperty("valorInicial");
  });

  it("fecha o caixa com PUT, conferência, fundo contado e observação", async () => {
    put.mockResolvedValue({ data: { turnoId: 3, formasPagamento: [] } });
    const resumo = await fecharCaixa({
      conferencias: [{ formaPagamento: 1, valorInformado: 55 }],
      valorFundoCaixa: 100,
      observacao: "fim do dia",
    });
    expect(put).toHaveBeenCalledWith("/Caixa/fechar", {
      conferencias: [{ formaPagamento: 1, valorInformado: 55 }],
      valorFundoCaixa: 100,
      observacao: "fim do dia",
    });
    expect(post).not.toHaveBeenCalled();
    expect(resumo.turnoId).toBe(3);
  });

  it("fecha o caixa sem fundo contado enviando null", async () => {
    put.mockResolvedValue({ data: { turnoId: 3 } });
    await fecharCaixa({ conferencias: [] });
    expect(put.mock.calls[0][1]).toMatchObject({ valorFundoCaixa: null });
  });
});

describe("caixa service: turnos", () => {
  it("lê os nomes novos do turno", async () => {
    get.mockResolvedValue({
      data: {
        turnoId: 1,
        valorFundoCaixa: 100,
        saldoCaixa: 250,
        totalEntradas: 300,
        totalSaidas: 50,
        disponivelSangria: 150,
        formasPagamento: [{ formaPagamento: 1, entradas: 300, saidas: 50, valorEsperado: 250 }],
      },
    });
    const turno = await getTurnoAtual();
    expect(get).toHaveBeenCalledWith("/Caixa/turno");
    expect(turno).toMatchObject({ valorFundoCaixa: 100, saldoCaixa: 250, totalEntradas: 300, totalSaidas: 50, disponivelSangria: 150 });
  });

  it("GET /Caixa/turno sem valorEsperado por forma: deriva entradas menos saídas e nunca devolve undefined", async () => {
    get.mockResolvedValue({
      data: {
        turnoId: 1,
        valorFundoCaixa: 100,
        totalEntradas: 450,
        totalSaidas: 50,
        disponivelSangria: 250,
        formasPagamento: [
          { formaPagamento: 1, descricao: "Dinheiro", entradas: 300, saidas: 50 },
          { formaPagamento: 2, descricao: "Pix", entradas: 150, saidas: 0 },
        ],
      },
    });
    const turno = await getTurnoAtual();
    expect(turno?.formasPagamento).toEqual([
      expect.objectContaining({ formaPagamento: 1, entradas: 300, saidas: 50, valorEsperado: 250, valorInformado: null, diferenca: null }),
      expect.objectContaining({ formaPagamento: 2, entradas: 150, saidas: 0, valorEsperado: 150 }),
    ]);
    // Sem saldoCaixa na resposta, o total esperado é a soma do esperado das formas.
    expect(turno?.saldoCaixa).toBe(400);
  });

  it("forma sem nenhum valor vira zero em vez de undefined", async () => {
    get.mockResolvedValue({ data: { turnoId: 1, formasPagamento: [{ formaPagamento: 1 }] } });
    const turno = await getTurnoAtual();
    expect(turno?.formasPagamento[0]).toMatchObject({ entradas: 0, saidas: 0, valorEsperado: 0 });
    expect(Number.isNaN(turno?.saldoCaixa)).toBe(false);
  });

  it("aceita os nomes antigos enquanto a API não é conferida", async () => {
    get.mockResolvedValue({ data: { turnoId: 1, valorInicial: 80, totalEsperado: 200, totalInformado: 190 } });
    const turno = await getTurnoAtual();
    expect(turno).toMatchObject({ valorFundoCaixa: 80, saldoCaixa: 200, saldoCaixaInformado: 190, formasPagamento: [] });
  });

  it("não há turno aberto vira null", async () => {
    get.mockRejectedValue(new ApiError("not_found"));
    expect(await getTurnoAtual()).toBeNull();
  });

  it("lista os turnos normalizando", async () => {
    get.mockResolvedValue({ data: [{ turnoId: 1, valorFundoCaixa: 10, totalSaida: 5, totalDiferenca: -2 }] });
    const turnos = await listTurnos();
    expect(get).toHaveBeenCalledWith("/Caixa/turnos");
    expect(turnos[0]).toMatchObject({ valorFundoCaixa: 10, totalSaida: 5, totalDiferenca: -2, formasPagamento: [] });
  });
});

describe("caixa service: movimentos e histórico", () => {
  it("lista os movimentos do caixa aberto já normalizados", async () => {
    get.mockResolvedValue({ data: [{ id: 1, tipoDescricao: "Entrada", valor: 25, usuario: "Ana" }] });
    const lista = await listMovimentos();
    expect(get).toHaveBeenCalledWith("/Caixa/movimentos");
    expect(lista).toEqual([expect.objectContaining({ movimentoId: 1, tipo: "entrada", valor: 25, usuario: "Ana" })]);
  });

  it("sem caixa aberto os movimentos vêm vazios", async () => {
    get.mockRejectedValue(new ApiError("not_found"));
    expect(await listMovimentos()).toEqual([]);
  });

  it("os outros erros dos movimentos sobem", async () => {
    get.mockRejectedValue(new ApiError("forbidden"));
    await expect(listMovimentos()).rejects.toMatchObject({ kind: "forbidden" });
  });

  it("pede o histórico com período e página, sem enviar datas vazias", async () => {
    get.mockResolvedValue({ data: { items: [{ caixaId: 3, usuarioAbertura: "Ana" }], page: 2, pageSize: 20, totalRecords: 41, totalPages: 3 } });
    const pagina = await listHistoricoCaixas({ dataInicio: "2026-10-01", dataFim: "", pagina: 2 });
    expect(get).toHaveBeenCalledWith("/Caixa/historico", { params: { pagina: 2, tamanhoPagina: 20, dataInicio: "2026-10-01" } });
    expect(pagina).toMatchObject({ page: 2, pageSize: 20, totalRecords: 41, totalPages: 3 });
    expect(pagina.items[0]).toMatchObject({ caixaId: 3, abriu: "Ana" });
  });

  it("o histórico usa os padrões da API e tolera resposta sem itens", async () => {
    get.mockResolvedValue({ data: {} });
    const pagina = await listHistoricoCaixas();
    expect(get).toHaveBeenCalledWith("/Caixa/historico", { params: { pagina: 1, tamanhoPagina: 20 } });
    expect(pagina).toEqual({ items: [], page: 1, pageSize: 20, totalRecords: 0, totalPages: 0 });
  });

  it("lista os movimentos de um caixa fechado", async () => {
    get.mockResolvedValue({ data: [{ id: 5, tipoDescricao: "Saída", origemDescricao: "Sangria", valor: 40 }] });
    const lista = await listMovimentosCaixa(12);
    expect(get).toHaveBeenCalledWith("/Caixa/historico/12/movimentos");
    expect(lista[0]).toMatchObject({ movimentoId: 5, tipo: "sangria", valor: 40 });
  });

  it("caixa ainda aberto ou inexistente sobe como erro", async () => {
    get.mockRejectedValue(new ApiError("not_found"));
    await expect(listMovimentosCaixa(99)).rejects.toMatchObject({ kind: "not_found" });
  });
});

describe("caixa service: caixa aberto", () => {
  it("campos de total ausentes viram null e o fundo ausente vira zero", async () => {
    get.mockResolvedValue({ data: { caixaId: 1, dataHoraAbertura: "2026-10-23T08:00:00" } });
    expect(await getCaixa()).toMatchObject({ caixaId: 1, valorFundoCaixa: 0, valorTotalEntrada: null, valorTotalSaida: null });
  });

  it("sem caixa aberto devolve null", async () => {
    get.mockRejectedValue(new ApiError("not_found"));
    expect(await getCaixa()).toBeNull();
  });
});
