import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SLOT_MIN, useBarCapacity } from "./useBarCapacity";

type Retorno = (entradas: { contentRect: { width: number } }[]) => void;

// ResizeObserver falso: guarda quem foi observado e deixa o teste disparar novas larguras.
function simularResizeObserver() {
  const instancias: { retorno: Retorno; observados: Element[]; disconnect: ReturnType<typeof vi.fn> }[] = [];
  vi.stubGlobal(
    "ResizeObserver",
    class {
      retorno: Retorno;
      observados: Element[] = [];
      disconnect = vi.fn();
      constructor(retorno: Retorno) {
        this.retorno = retorno;
        instancias.push(this);
      }
      observe(elemento: Element) {
        this.observados.push(elemento);
      }
      unobserve() {}
    },
  );
  return {
    instancias,
    medir(largura: number) {
      act(() => instancias[instancias.length - 1].retorno([{ contentRect: { width: largura } }]));
    },
  };
}

function montar(larguraMaxima?: number) {
  const barra = document.createElement("nav");
  const hook = renderHook(() => useBarCapacity(larguraMaxima));
  act(() => hook.result.current.ref(barra));
  return { ...hook, barra };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useBarCapacity", () => {
  it("a capacidade é nula até a primeira medição", () => {
    simularResizeObserver();
    const { result } = renderHook(() => useBarCapacity());

    expect(result.current.capacidade).toBeNull();
  });

  it("continua nula depois de ligar o elemento, até o observador medir", () => {
    const { instancias } = simularResizeObserver();
    const { result } = montar();

    expect(instancias).toHaveLength(1);
    expect(result.current.capacidade).toBeNull();
  });

  it.each([
    [320, 4],
    [375, 5],
    [480, 7],
    [768, 11],
    [1024, 15],
  ])("em %ipx cabem %i espaços", (largura, esperado) => {
    const simulacao = simularResizeObserver();
    const { result } = montar();

    simulacao.medir(largura);

    expect(result.current.capacidade).toBe(esperado);
    expect(Math.floor(largura / SLOT_MIN)).toBe(esperado);
  });

  it("limita a largura útil à largura máxima do conteúdo", () => {
    const simulacao = simularResizeObserver();
    const { result } = montar(1120);

    simulacao.medir(1440);

    expect(result.current.capacidade).toBe(Math.floor(1120 / SLOT_MIN));
  });

  it("atualiza a capacidade quando a largura muda, como ao girar o aparelho", () => {
    const simulacao = simularResizeObserver();
    const { result } = montar();

    simulacao.medir(375);
    expect(result.current.capacidade).toBe(5);

    simulacao.medir(812);
    expect(result.current.capacidade).toBe(11);

    simulacao.medir(375);
    expect(result.current.capacidade).toBe(5);
  });

  it("arredonda para baixo: um espaço incompleto não conta", () => {
    const simulacao = simularResizeObserver();
    const { result } = montar();

    simulacao.medir(SLOT_MIN * 4 - 1);

    expect(result.current.capacidade).toBe(3);
  });

  it("uma largura zero resulta em capacidade zero", () => {
    const simulacao = simularResizeObserver();
    const { result } = montar();

    simulacao.medir(0);

    expect(result.current.capacidade).toBe(0);
  });

  it("observa o elemento da barra e desconecta ao desmontar", () => {
    const { instancias } = simularResizeObserver();
    const { barra, unmount } = montar();

    expect(instancias[0].observados).toEqual([barra]);
    expect(instancias[0].disconnect).not.toHaveBeenCalled();

    unmount();

    expect(instancias[0].disconnect).toHaveBeenCalledTimes(1);
  });

  it("troca de observador quando o elemento muda", () => {
    const { instancias } = simularResizeObserver();
    const { result } = montar();
    const outra = document.createElement("nav");

    act(() => result.current.ref(outra));

    expect(instancias).toHaveLength(2);
    expect(instancias[0].disconnect).toHaveBeenCalledTimes(1);
    expect(instancias[1].observados).toEqual([outra]);
  });

  it("sem ResizeObserver, mede o elemento e acompanha a janela", async () => {
    vi.stubGlobal("ResizeObserver", undefined);
    const barra = document.createElement("nav");
    let largura = 375;
    vi.spyOn(barra, "getBoundingClientRect").mockImplementation(() => ({ width: largura }) as DOMRect);
    const { result } = renderHook(() => useBarCapacity());

    await act(async () => result.current.ref(barra));
    expect(result.current.capacidade).toBe(5);

    largura = 1024;
    act(() => window.dispatchEvent(new Event("resize")));
    expect(result.current.capacidade).toBe(15);
  });
});
