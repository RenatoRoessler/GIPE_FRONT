import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { ThemeProvider } from "styled-components";
import { afterEach, describe, expect, it, vi } from "vitest";
import { lightTheme } from "@/styles/theme";
import { useIsMobile, useMediaQuery } from "./useMediaQuery";

type Ouvinte = () => void;

// matchMedia falso: `mudar` troca o resultado e avisa quem está ouvindo.
function simularMatchMedia(inicial: boolean) {
  let matches = inicial;
  const ouvintes = new Set<Ouvinte>();
  const consultas: string[] = [];
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => {
      consultas.push(query);
      return {
        get matches() {
          return matches;
        },
        media: query,
        addEventListener: (_: string, ouvinte: Ouvinte) => ouvintes.add(ouvinte),
        removeEventListener: (_: string, ouvinte: Ouvinte) => ouvintes.delete(ouvinte),
      };
    }),
  );
  return {
    consultas,
    ouvintes,
    mudar(valor: boolean) {
      matches = valor;
      ouvintes.forEach((ouvinte) => ouvinte());
    },
  };
}

const wrapper = ({ children }: { children: ReactNode }) => <ThemeProvider theme={lightTheme}>{children}</ThemeProvider>;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useMediaQuery", () => {
  it("sem matchMedia (servidor, testes) vale falso", () => {
    vi.stubGlobal("matchMedia", undefined);
    const { result } = renderHook(() => useMediaQuery("(max-width: 100px)"));

    expect(result.current).toBe(false);
  });

  it("devolve o resultado da consulta e acompanha as mudanças", () => {
    const tela = simularMatchMedia(true);
    const { result, unmount } = renderHook(() => useMediaQuery("(max-width: 100px)"));

    expect(result.current).toBe(true);
    expect(tela.ouvintes.size).toBe(1);

    act(() => tela.mudar(false));
    expect(result.current).toBe(false);

    unmount();
    expect(tela.ouvintes.size).toBe(0);
  });
});

describe("useIsMobile", () => {
  it("consulta um pixel abaixo de breakpoints.md", () => {
    const tela = simularMatchMedia(true);
    const { result } = renderHook(() => useIsMobile(), { wrapper });

    expect(result.current).toBe(true);
    expect(tela.consultas).toContain("(max-width: 767px)");
  });

  it("em tela larga vale falso", () => {
    simularMatchMedia(false);
    const { result } = renderHook(() => useIsMobile(), { wrapper });

    expect(result.current).toBe(false);
  });
});
