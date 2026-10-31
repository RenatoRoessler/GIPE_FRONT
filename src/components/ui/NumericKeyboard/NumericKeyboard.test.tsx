import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ModoNumerico } from "@/lib/teclado/tipos";
import { renderWithTheme } from "@/test/render";
import { NumericKeyboard } from "./NumericKeyboard";

function renderizar(modo: ModoNumerico, valor = "", extras: { maxLength?: number; rotuloAcao?: string } = {}) {
  const props = { onChar: vi.fn(), onApagar: vi.fn(), onAcao: vi.fn() };
  renderWithTheme(<NumericKeyboard modo={modo} valor={valor} rotuloAcao={extras.rotuloAcao ?? "Próximo"} maxLength={extras.maxLength} {...props} />);
  return props;
}

const ponto = () => screen.getByRole("button", { name: "Ponto, segure para hífen" });
const virgula = () => screen.getByRole("button", { name: "Vírgula" });

describe("NumericKeyboard", () => {
  it("insere dígitos, apaga e aciona o Próximo", () => {
    const { onChar, onApagar, onAcao } = renderizar("inteiro");

    fireEvent.click(screen.getByRole("button", { name: "5" }));
    fireEvent.click(screen.getByRole("button", { name: "Apagar" }));
    fireEvent.click(screen.getByRole("button", { name: "Próximo campo" }));

    expect(onChar).toHaveBeenCalledWith("5");
    expect(onApagar).toHaveBeenCalledTimes(1);
    expect(onAcao).toHaveBeenCalledTimes(1);
  });

  it("modo inteiro desabilita vírgula, ponto e hífen", () => {
    renderizar("inteiro", "12");

    expect(virgula()).toBeDisabled();
    expect(ponto()).toBeDisabled();
  });

  it("modo decimal não aceita vírgula no início nem ponto", () => {
    renderizar("decimal", "");

    expect(virgula()).toBeDisabled();
    expect(ponto()).toBeDisabled();
  });

  it("modo decimal habilita a vírgula depois de um dígito", () => {
    renderizar("decimal", "12");
    expect(virgula()).toBeEnabled();
  });

  it("modo decimal desabilita a vírgula repetida e os dígitos após 2 casas", () => {
    renderizar("decimal", "12,50");

    expect(virgula()).toBeDisabled();
    expect(screen.getByRole("button", { name: "3" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Apagar" })).toBeEnabled();
  });

  it("modo livre aceita ponto e vírgula", () => {
    const { onChar } = renderizar("livre", "1");

    expect(ponto()).toBeEnabled();
    fireEvent.click(ponto());
    expect(onChar).toHaveBeenCalledWith(".");
  });

  it("desabilita os dígitos ao atingir o limite", () => {
    renderizar("inteiro", "123", { maxLength: 3 });

    expect(screen.getByRole("button", { name: "4" })).toBeDisabled();
  });

  it("usa o rótulo OK no último campo", () => {
    renderizar("inteiro", "", { rotuloAcao: "OK" });

    expect(screen.getByRole("button", { name: "Concluir" })).toHaveTextContent("OK");
  });

  describe("toque longo no ponto", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("insere o hífen no modo livre", () => {
      const { onChar } = renderizar("livre", "1");

      fireEvent.pointerDown(ponto());
      act(() => {
        vi.advanceTimersByTime(450);
      });
      fireEvent.pointerUp(ponto());
      fireEvent.click(ponto());

      expect(onChar).toHaveBeenCalledTimes(1);
      expect(onChar).toHaveBeenCalledWith("-");
    });
  });

  it("é um grupo com o nome Teclado numérico", () => {
    renderizar("inteiro");

    expect(screen.getByRole("group", { name: "Teclado numérico" })).toBeInTheDocument();
  });
});
