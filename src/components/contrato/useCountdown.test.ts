import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatCountdown, useCountdown } from "./useCountdown";

describe("useCountdown", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("conta de segundo em segundo até zero e para", () => {
    const { result } = renderHook(() => useCountdown());
    expect(result.current.restante).toBe(0);

    act(() => result.current.iniciar(3));
    expect(result.current.restante).toBe(3);

    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.restante).toBe(2);
    // Cada tick agenda o próximo depois de renderizar: um segundo por vez.
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.restante).toBe(1);
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.restante).toBe(0);

    act(() => vi.advanceTimersByTime(5000));
    expect(result.current.restante).toBe(0);
  });

  it("reiniciar troca a contagem em andamento", () => {
    const { result } = renderHook(() => useCountdown());
    act(() => result.current.iniciar(10));
    act(() => vi.advanceTimersByTime(4000));
    act(() => result.current.iniciar(60));
    expect(result.current.restante).toBe(60);
  });
});

describe("formatCountdown", () => {
  it("escreve minutos e segundos", () => {
    expect(formatCountdown(42)).toBe("0:42");
    expect(formatCountdown(60)).toBe("1:00");
    expect(formatCountdown(5)).toBe("0:05");
  });
});
