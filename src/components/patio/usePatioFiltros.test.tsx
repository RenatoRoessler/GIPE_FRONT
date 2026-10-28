import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePatioFiltros } from "./usePatioFiltros";

const replace = vi.fn();
let query = "";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/patio",
  useSearchParams: () => new URLSearchParams(query),
}));

describe("usePatioFiltros", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    replace.mockClear();
    query = "";
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("lê os filtros da URL", () => {
    query = "q=gol&tipo=avulsos&cat=2&chave=fora";
    const { result } = renderHook(() => usePatioFiltros());

    expect(result.current.busca).toBe("gol");
    expect(result.current.tipo).toBe("avulsos");
    expect(result.current.categoria).toBe(2);
    expect(result.current.chave).toBe("fora");
    expect(replace).not.toHaveBeenCalled();
  });

  it("grava a busca na URL só depois da pausa, com replace", () => {
    const { result } = renderHook(() => usePatioFiltros());

    act(() => result.current.setBusca("fl"));
    act(() => result.current.setBusca("flp"));
    expect(replace).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith("/patio?q=flp", { scroll: false });
  });

  it("muda tipo e categoria na hora e preserva a busca", () => {
    query = "q=gol";
    const { result } = renderHook(() => usePatioFiltros());

    act(() => result.current.setTipo("mensalistas"));
    expect(replace).toHaveBeenLastCalledWith("/patio?q=gol&tipo=mensalistas", { scroll: false });

    act(() => result.current.setCategoria(3));
    expect(replace).toHaveBeenLastCalledWith("/patio?q=gol&cat=3", { scroll: false });
  });

  it("limpar filtros mantém a busca; limpar busca mantém os filtros", () => {
    query = "q=gol&tipo=avulsos&chave=dentro";
    const { result } = renderHook(() => usePatioFiltros());

    act(() => result.current.limparFiltros());
    expect(replace).toHaveBeenLastCalledWith("/patio?q=gol", { scroll: false });

    act(() => result.current.limparBusca());
    expect(replace).toHaveBeenLastCalledWith("/patio?tipo=avulsos&chave=dentro", { scroll: false });
    expect(result.current.busca).toBe("");
  });
});
