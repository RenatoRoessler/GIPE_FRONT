import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PrecoView } from "@/types/preco";
import type { UsePrecos } from "./usePrecos";
import type { PrecosUrlState } from "./usePrecosUrlState";
import { maiorId, selecaoPadrao, useSelecaoPrecos } from "./useSelecaoPrecos";

function preco(id: number, extra: Partial<PrecoView> = {}): PrecoView {
  return {
    rotatividadeId: id,
    empresaConveniadaId: null,
    descricao: `Tabela ${id}`,
    tipoRegra: 1,
    inicioVigencia: "2020-01-01T00:00:00",
    fimVigencia: null,
    toleranciaEntradaMinutos: 0,
    toleranciaAlteracaoFaixaMinutos: 0,
    periodoDiaria: 720,
    valorDiaria: 0,
    valorAdicionalDiaria: 0,
    ativo: true,
    regras: [],
    faixas: [],
    categorias: [],
    ...extra,
  };
}

const INATIVA = (id: number) => preco(id, { ativo: false });
const ENCERRADA = (id: number) => preco(id, { fimVigencia: "2021-01-01T00:00:00" });

const selecionar = vi.fn();

function estado(extra: Partial<PrecosUrlState> = {}): PrecosUrlState {
  return {
    q: "",
    situacao: "todas",
    pagina: 1,
    preco: null,
    salvo: null,
    setQ: vi.fn(),
    setSituacao: vi.fn(),
    setPagina: vi.fn(),
    selecionar,
    limparSalvo: vi.fn(),
    ...extra,
  };
}

function precos(todas: PrecoView[], itensDaPagina = todas, atualizando = false): UsePrecos {
  return {
    status: "pronto",
    todas,
    filtradas: todas,
    pagina: { itens: itensDaPagina, page: 1, totalPages: 1, totalRecords: todas.length, pageSize: 20 },
    contagem: `${todas.length} tabelas`,
    paginaForaDoIntervalo: false,
    atualizando,
  };
}

beforeEach(() => {
  selecionar.mockReset();
});

describe("selecaoPadrao e maiorId", () => {
  it("escolhe a primeira vigente, senão o primeiro item, senão nada", () => {
    expect(selecaoPadrao([INATIVA(1), preco(2), preco(3)], new Date())?.rotatividadeId).toBe(2);
    expect(selecaoPadrao([INATIVA(1), ENCERRADA(2)], new Date())?.rotatividadeId).toBe(1);
    expect(selecaoPadrao([], new Date())).toBeNull();
  });

  it("maiorId devolve o maior id da lista", () => {
    expect(maiorId([preco(4), preco(12), preco(7)])).toBe(12);
    expect(maiorId([])).toBeNull();
  });
});

describe("useSelecaoPrecos: seleção efetiva", () => {
  it("enquanto carrega, não há seleção", () => {
    const { result } = renderHook(() => useSelecaoPrecos(estado(), { status: "carregando" }));
    expect(result.current).toEqual({ selecionada: null, inexistente: false, detalheAberto: false });
  });

  it("na falha, não há seleção", () => {
    const { result } = renderHook(() => useSelecaoPrecos(estado(), { status: "erro", erro: "x", refetch: vi.fn() }));
    expect(result.current.selecionada).toBeNull();
  });

  it("sem escolha explícita, vale a primeira vigente da página e o detalhe não fica aberto", () => {
    const { result } = renderHook(() => useSelecaoPrecos(estado(), precos([INATIVA(1), preco(2), preco(3)])));
    expect(result.current.selecionada?.rotatividadeId).toBe(2);
    expect(result.current.detalheAberto).toBe(false);
    expect(selecionar).not.toHaveBeenCalled();
  });

  it("sem vigente na página, vale o primeiro item", () => {
    const { result } = renderHook(() => useSelecaoPrecos(estado(), precos([INATIVA(1), ENCERRADA(2)])));
    expect(result.current.selecionada?.rotatividadeId).toBe(1);
  });

  it("a seleção padrão olha só a página atual", () => {
    const todas = [INATIVA(1), INATIVA(2), preco(3)];
    const { result } = renderHook(() => useSelecaoPrecos(estado(), precos(todas, [INATIVA(1), INATIVA(2)])));
    expect(result.current.selecionada?.rotatividadeId).toBe(1);
  });

  it("lista vazia não tem seleção", () => {
    const { result } = renderHook(() => useSelecaoPrecos(estado(), precos([])));
    expect(result.current).toEqual({ selecionada: null, inexistente: false, detalheAberto: false });
  });

  it("a escolha explícita vale mesmo fora da página atual e abre o detalhe", () => {
    const todas = [preco(1), preco(2), preco(30)];
    const { result } = renderHook(() => useSelecaoPrecos(estado({ preco: 30 }), precos(todas, [preco(1), preco(2)])));
    expect(result.current).toMatchObject({ detalheAberto: true, inexistente: false });
    expect(result.current.selecionada?.rotatividadeId).toBe(30);
  });

  it("escolha explícita que não existe mais é sinalizada", () => {
    const { result } = renderHook(() => useSelecaoPrecos(estado({ preco: 99 }), precos([preco(1)])));
    expect(result.current).toEqual({ selecionada: null, inexistente: true, detalheAberto: true });
  });

  it("enquanto carrega, o detalhe fica aberto se o endereço já tem a tabela (celular)", () => {
    const { result } = renderHook(() => useSelecaoPrecos(estado({ preco: 5 }), { status: "carregando" }));
    expect(result.current).toEqual({ selecionada: null, inexistente: false, detalheAberto: true });
  });
});

describe("useSelecaoPrecos: depois de criar", () => {
  it("seleciona a tabela de maior id quando a lista termina de recarregar", () => {
    renderHook(() => useSelecaoPrecos(estado({ salvo: "criado" }), precos([preco(3), preco(12), preco(7)])));
    expect(selecionar).toHaveBeenCalledTimes(1);
    expect(selecionar).toHaveBeenCalledWith(12);
  });

  it("espera a revalidação terminar para não escolher entre dados antigos", () => {
    const { rerender } = renderHook(({ p }) => useSelecaoPrecos(estado({ salvo: "criado" }), p), {
      initialProps: { p: precos([preco(3)], [preco(3)], true) },
    });
    expect(selecionar).not.toHaveBeenCalled();
    rerender({ p: precos([preco(3), preco(9)], [preco(3), preco(9)], false) });
    expect(selecionar).toHaveBeenCalledTimes(1);
    expect(selecionar).toHaveBeenCalledWith(9);
  });

  it("só seleciona uma vez, mesmo que a tela renderize de novo", () => {
    const { rerender } = renderHook(() => useSelecaoPrecos(estado({ salvo: "criado" }), precos([preco(3), preco(9)])));
    rerender();
    rerender();
    expect(selecionar).toHaveBeenCalledTimes(1);
  });

  it("não mexe se o usuário já escolheu uma tabela", () => {
    renderHook(() => useSelecaoPrecos(estado({ salvo: "criado", preco: 3 }), precos([preco(3), preco(9)])));
    expect(selecionar).not.toHaveBeenCalled();
  });

  it("depois de editar não escolhe nada sozinho", () => {
    renderHook(() => useSelecaoPrecos(estado({ salvo: "atualizado" }), precos([preco(3), preco(9)])));
    expect(selecionar).not.toHaveBeenCalled();
  });

  it("sem aviso de criação não escolhe nada sozinho", () => {
    renderHook(() => useSelecaoPrecos(estado(), precos([preco(3), preco(9)])));
    expect(selecionar).not.toHaveBeenCalled();
  });

  it("lista vazia depois de criar não quebra", () => {
    renderHook(() => useSelecaoPrecos(estado({ salvo: "criado" }), precos([])));
    expect(selecionar).not.toHaveBeenCalled();
  });
});
