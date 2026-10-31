import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { setNativeValue } from "./setNativeValue";

function Controlado({ format = (v: string) => v }: { format?: (valor: string) => string }) {
  const [valor, setValor] = useState("");
  return <input aria-label="campo" value={valor} onChange={(e) => setValor(format(e.target.value))} />;
}

describe("setNativeValue", () => {
  it("faz um input controlado do React receber o onChange", () => {
    render(<Controlado />);
    const campo = screen.getByLabelText("campo") as HTMLInputElement;

    setNativeValue(campo, "ABC");

    expect(campo.value).toBe("ABC");
  });

  it("dispara o evento input com bubbles", () => {
    const ouvinte = vi.fn();
    document.body.addEventListener("input", ouvinte);
    render(<input aria-label="campo" />);

    setNativeValue(screen.getByLabelText("campo") as HTMLInputElement, "1");

    expect(ouvinte).toHaveBeenCalledTimes(1);
    document.body.removeEventListener("input", ouvinte);
  });

  it("respeita o format que reescreve o valor e deixa o cursor no fim", () => {
    render(<Controlado format={(v) => `R$ ${v.replace(/^R\$ /, "")}`} />);
    const campo = screen.getByLabelText("campo") as HTMLInputElement;

    setNativeValue(campo, "12");

    expect(campo.value).toBe("R$ 12");
    expect(campo.selectionStart).toBe(5);
    expect(campo.selectionEnd).toBe(5);
  });

  it("não quebra em tipos sem seleção", () => {
    render(<input aria-label="campo" type="number" />);
    const campo = screen.getByLabelText("campo") as HTMLInputElement;

    expect(() => setNativeValue(campo, "12")).not.toThrow();
    fireEvent.input(campo);
    expect(campo.value).toBe("12");
  });
});
