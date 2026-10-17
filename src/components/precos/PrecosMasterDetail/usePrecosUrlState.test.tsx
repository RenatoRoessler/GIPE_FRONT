import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const nav = vi.hoisted(() => ({
  params: new URLSearchParams(),
  replace: vi.fn(),
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: nav.replace, push: nav.push }),
  useSearchParams: () => nav.params,
}));

import { BUSCA_DEBOUNCE_MS, usePrecosUrlState } from "./usePrecosUrlState";

// Simula a navegação: o que o router recebe vira o endereço lido no próximo render.
function irPara(url: string) {
  nav.params = new URLSearchParams(url.includes("?") ? url.split("?")[1] : "");
}

beforeEach(() => {
  vi.useFakeTimers();
  nav.replace.mockReset();
  nav.push.mockReset();
  irPara("/precos");
});

afterEach(() => {
  vi.useRealTimers();
});

describe("usePrecosUrlState: leitura", () => {
  it("endereço limpo significa tudo, página 1 e sem seleção", () => {
    const { result } = renderHook(() => usePrecosUrlState());
    expect(result.current).toMatchObject({ q: "", situacao: "todas", pagina: 1, preco: null, salvo: null });
  });

  it("lê os cinco parâmetros", () => {
    irPara("/precos?preco=7&q=black&situacao=agendada&pagina=3&salvo=criado");
    const { result } = renderHook(() => usePrecosUrlState());
    expect(result.current).toMatchObject({ q: "black", situacao: "agendada", pagina: 3, preco: 7, salvo: "criado" });
  });

  it.each([
    ["situacao=qualquer", { situacao: "todas" }],
    ["pagina=abc", { pagina: 1 }],
    ["pagina=0", { pagina: 1 }],
    ["pagina=-2", { pagina: 1 }],
    ["pagina=1.5", { pagina: 1 }],
    ["preco=abc", { preco: null }],
    ["preco=1a", { preco: null }],
    ["preco=0", { preco: null }],
    ["preco=-3", { preco: null }],
    ["salvo=outro", { salvo: null }],
  ])("ignora o valor inválido de %s", (query, esperado) => {
    irPara(`/precos?${query}`);
    const { result } = renderHook(() => usePrecosUrlState());
    expect(result.current).toMatchObject(esperado);
  });
});

describe("usePrecosUrlState: escrita", () => {
  it("trocar a situação zera a página e mantém busca e seleção", () => {
    irPara("/precos?preco=4&q=tarifa&pagina=3");
    const { result } = renderHook(() => usePrecosUrlState());
    act(() => result.current.setSituacao("vigente"));
    expect(nav.replace).toHaveBeenCalledWith("/precos?preco=4&q=tarifa&situacao=vigente", { scroll: false });
  });

  it("voltar a 'todas' tira o parâmetro do endereço", () => {
    irPara("/precos?situacao=inativa");
    const { result } = renderHook(() => usePrecosUrlState());
    act(() => result.current.setSituacao("todas"));
    expect(nav.replace).toHaveBeenCalledWith("/precos", { scroll: false });
  });

  it("troca de página mantém o resto e omite a página 1", () => {
    irPara("/precos?q=tarifa&situacao=vigente");
    const { result } = renderHook(() => usePrecosUrlState());
    act(() => result.current.setPagina(2));
    expect(nav.replace).toHaveBeenLastCalledWith("/precos?q=tarifa&situacao=vigente&pagina=2", { scroll: false });
    act(() => result.current.setPagina(1));
    expect(nav.replace).toHaveBeenLastCalledWith("/precos?q=tarifa&situacao=vigente", { scroll: false });
  });

  it("selecionar substitui a entrada atual do histórico", () => {
    const { result } = renderHook(() => usePrecosUrlState());
    act(() => result.current.selecionar(5));
    expect(nav.replace).toHaveBeenCalledWith("/precos?preco=5", { scroll: false });
    expect(nav.push).not.toHaveBeenCalled();
  });

  it("selecionar com push cria uma entrada no histórico", () => {
    const { result } = renderHook(() => usePrecosUrlState());
    act(() => result.current.selecionar(5, { push: true }));
    expect(nav.push).toHaveBeenCalledWith("/precos?preco=5", { scroll: false });
    expect(nav.replace).not.toHaveBeenCalled();
  });

  it("selecionar nulo volta para a lista, mantendo busca, filtro e página", () => {
    irPara("/precos?preco=5&q=tarifa&situacao=vigente&pagina=2");
    const { result } = renderHook(() => usePrecosUrlState());
    act(() => result.current.selecionar(null));
    expect(nav.replace).toHaveBeenCalledWith("/precos?q=tarifa&situacao=vigente&pagina=2", { scroll: false });
  });

  it("limparSalvo tira só o aviso do endereço", () => {
    irPara("/precos?preco=5&salvo=atualizado&pagina=2");
    const { result } = renderHook(() => usePrecosUrlState());
    act(() => result.current.limparSalvo());
    expect(nav.replace).toHaveBeenCalledWith("/precos?preco=5&pagina=2", { scroll: false });
  });

  it("mantém o aviso salvo enquanto o usuário navega", () => {
    irPara("/precos?salvo=criado");
    const { result } = renderHook(() => usePrecosUrlState());
    act(() => result.current.selecionar(8));
    expect(nav.replace).toHaveBeenCalledWith("/precos?preco=8&salvo=criado", { scroll: false });
  });
});

describe("usePrecosUrlState: busca", () => {
  it("o texto muda na hora, mas o endereço só depois do debounce", () => {
    const { result } = renderHook(() => usePrecosUrlState());
    act(() => result.current.setQ("bla"));
    expect(result.current.q).toBe("bla");
    expect(nav.replace).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(BUSCA_DEBOUNCE_MS - 1));
    expect(nav.replace).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1));
    expect(nav.replace).toHaveBeenCalledTimes(1);
    expect(nav.replace).toHaveBeenCalledWith("/precos?q=bla", { scroll: false });
  });

  it("digitar de novo reinicia o debounce e grava só o último texto", () => {
    const { result } = renderHook(() => usePrecosUrlState());
    act(() => result.current.setQ("b"));
    act(() => vi.advanceTimersByTime(200));
    act(() => result.current.setQ("bl"));
    act(() => vi.advanceTimersByTime(200));
    act(() => result.current.setQ("bla"));
    act(() => vi.advanceTimersByTime(BUSCA_DEBOUNCE_MS));
    expect(nav.replace).toHaveBeenCalledTimes(1);
    expect(nav.replace).toHaveBeenCalledWith("/precos?q=bla", { scroll: false });
  });

  it("mudar a busca zera a página no endereço, sem esperar o debounce", () => {
    irPara("/precos?q=tarifa&pagina=3");
    const { result } = renderHook(() => usePrecosUrlState());
    act(() => result.current.setQ("tarifas"));
    expect(nav.replace).toHaveBeenCalledWith("/precos?q=tarifa", { scroll: false });
  });

  it("a gravação do debounce mantém a seleção e a situação e volta à página 1", () => {
    irPara("/precos?preco=4&situacao=vigente");
    const { result } = renderHook(() => usePrecosUrlState());
    act(() => result.current.setQ("moto"));
    act(() => vi.advanceTimersByTime(BUSCA_DEBOUNCE_MS));
    expect(nav.replace).toHaveBeenCalledWith("/precos?preco=4&q=moto&situacao=vigente", { scroll: false });
  });

  it("limpar a busca tira o parâmetro do endereço", () => {
    irPara("/precos?q=moto");
    const { result } = renderHook(() => usePrecosUrlState());
    act(() => result.current.setQ(""));
    act(() => vi.advanceTimersByTime(BUSCA_DEBOUNCE_MS));
    expect(nav.replace).toHaveBeenCalledWith("/precos", { scroll: false });
  });

  it("espaços nas pontas não geram parâmetro nem navegação extra", () => {
    const { result } = renderHook(() => usePrecosUrlState());
    act(() => result.current.setQ("   "));
    act(() => vi.advanceTimersByTime(BUSCA_DEBOUNCE_MS * 2));
    expect(nav.replace).not.toHaveBeenCalled();
  });

  it("não navega se o texto já é o do endereço", () => {
    irPara("/precos?q=moto");
    renderHook(() => usePrecosUrlState());
    act(() => vi.advanceTimersByTime(BUSCA_DEBOUNCE_MS * 2));
    expect(nav.replace).not.toHaveBeenCalled();
  });
});
