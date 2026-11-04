import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePatioConveniadaFiltros } from "./usePatioConveniadaFiltros";

const replace = vi.fn();
let query = "";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/patio-conveniada",
  useSearchParams: () => new URLSearchParams(query),
}));

describe("usePatioConveniadaFiltros", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    replace.mockClear();
    query = "";
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("lê a placa e o estacionamento da URL, sem reescrevê-la", () => {
    query = "placa=olg&estacionamento=37";
    const { result } = renderHook(() => usePatioConveniadaFiltros());

    expect(result.current.busca).toBe("olg");
    expect(result.current.estacionamento).toBe(37);
    expect(replace).not.toHaveBeenCalled();
  });

  it("estacionamento fora do formato vale 'todos'", () => {
    query = "estacionamento=abc";
    const { result } = renderHook(() => usePatioConveniadaFiltros());
    expect(result.current.estacionamento).toBeNull();
  });

  it("a placa aparece na hora e chega à URL só depois da pausa, com replace", () => {
    const { result } = renderHook(() => usePatioConveniadaFiltros());

    act(() => result.current.setBusca("ol"));
    act(() => result.current.setBusca("olg"));
    expect(result.current.busca).toBe("olg");
    expect(replace).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith("/patio-conveniada?placa=olg", { scroll: false });
  });

  it("placa parcial não vai ao servidor nem é inválida", () => {
    const { result } = renderHook(() => usePatioConveniadaFiltros());
    act(() => result.current.setBusca("OLG-7"));
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(result.current.placaEnviada).toBe("");
    expect(result.current.placaInvalida).toBe(false);
  });

  it("placa completa e válida vai ao servidor, normalizada", () => {
    const { result } = renderHook(() => usePatioConveniadaFiltros());
    act(() => result.current.setBusca("olg-7z94"));
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(result.current.placaEnviada).toBe("OLG7Z94");
    expect(result.current.placaInvalida).toBe(false);
  });

  it("placa completa e inválida é sinalizada e não vai ao servidor", () => {
    const { result } = renderHook(() => usePatioConveniadaFiltros());
    act(() => result.current.setBusca("1234567"));
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(result.current.placaEnviada).toBe("");
    expect(result.current.placaInvalida).toBe(true);
  });

  it("muda o estacionamento na hora e preserva a placa", () => {
    query = "placa=olg";
    const { result } = renderHook(() => usePatioConveniadaFiltros());
    act(() => result.current.setEstacionamento(40));
    expect(replace).toHaveBeenCalledWith("/patio-conveniada?placa=olg&estacionamento=40", { scroll: false });
  });

  it("limpar a busca preserva o estacionamento; limpar filtros tira os dois", () => {
    query = "placa=olg&estacionamento=40";
    const { result } = renderHook(() => usePatioConveniadaFiltros());

    act(() => result.current.limparBusca());
    expect(result.current.busca).toBe("");
    expect(replace).toHaveBeenLastCalledWith("/patio-conveniada?estacionamento=40", { scroll: false });

    act(() => result.current.limparFiltros());
    expect(replace).toHaveBeenLastCalledWith("/patio-conveniada", { scroll: false });
  });
});
