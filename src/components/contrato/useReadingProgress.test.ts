import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useReadingProgress } from "./useReadingProgress";

const originalInnerHeight = window.innerHeight;

function folha(rect: { top: number; height: number }) {
  const element = document.createElement("section");
  element.getBoundingClientRect = () => ({ top: rect.top, height: rect.height }) as DOMRect;
  return { current: element };
}

afterEach(() => {
  Object.defineProperty(window, "innerHeight", { value: originalInnerHeight, configurable: true });
});

describe("useReadingProgress", () => {
  it("começa em 0 enquanto a folha ainda não entrou na tela", async () => {
    Object.defineProperty(window, "innerHeight", { value: 800, configurable: true });
    const ref = folha({ top: 900, height: 2000 });
    const { result } = renderHook(() => useReadingProgress(ref, true));
    await waitFor(() => expect(result.current).toBe(0));
  });

  it("acompanha a rolagem até chegar ao fim da folha", async () => {
    Object.defineProperty(window, "innerHeight", { value: 800, configurable: true });
    const rect = { top: 100, height: 2000 };
    const ref = folha(rect);
    const { result } = renderHook(() => useReadingProgress(ref, true));

    // (800 - 100) / 2000
    await waitFor(() => expect(result.current).toBeCloseTo(0.35, 2));

    rect.top = -600;
    window.dispatchEvent(new Event("scroll"));
    await waitFor(() => expect(result.current).toBeCloseTo(0.7, 2));

    // A base da folha chegou à base da tela: tudo lido, e não passa de 1.
    rect.top = -1500;
    window.dispatchEvent(new Event("scroll"));
    await waitFor(() => expect(result.current).toBe(1));
  });

  it("não faz nada enquanto está inativo", () => {
    const ref = folha({ top: 0, height: 100 });
    const { result } = renderHook(() => useReadingProgress(ref, false));
    expect(result.current).toBe(0);
  });
});
