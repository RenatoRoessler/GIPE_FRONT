import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";
import { NumberStepper } from "./NumberStepper";

function setup(props: Partial<React.ComponentProps<typeof NumberStepper>> = {}) {
  const onChange = vi.fn();
  renderWithTheme(<NumberStepper label="Linhas" value={5} min={1} max={26} onChange={onChange} hint="A–E" {...props} />);
  return onChange;
}

describe("NumberStepper", () => {
  it("expõe o valor e os limites como spinbutton", () => {
    setup();
    const spin = screen.getByRole("spinbutton", { name: "Linhas" });
    expect(spin).toHaveAttribute("aria-valuenow", "5");
    expect(spin).toHaveAttribute("aria-valuemin", "1");
    expect(spin).toHaveAttribute("aria-valuemax", "26");
    expect(screen.getByText("A–E")).toBeInTheDocument();
  });

  it("aumenta e diminui pelos botões", async () => {
    const onChange = setup();
    await userEvent.click(screen.getByRole("button", { name: "Aumentar linhas" }));
    await userEvent.click(screen.getByRole("button", { name: "Diminuir linhas" }));
    expect(onChange).toHaveBeenNthCalledWith(1, 6);
    expect(onChange).toHaveBeenNthCalledWith(2, 4);
  });

  it("desabilita os botões nos limites", () => {
    setup({ value: 1 });
    expect(screen.getByRole("button", { name: "Diminuir linhas" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Aumentar linhas" })).toBeEnabled();
  });

  it("desabilita o aumento no máximo", () => {
    setup({ value: 26 });
    expect(screen.getByRole("button", { name: "Aumentar linhas" })).toBeDisabled();
  });

  it("responde às setas, Home e End", async () => {
    const onChange = setup();
    screen.getByRole("spinbutton").focus();
    await userEvent.keyboard("{ArrowUp}{ArrowDown}{Home}{End}");
    expect(onChange.mock.calls.map(([valor]) => valor)).toEqual([6, 4, 1, 26]);
  });

  it("não altera nada quando desabilitado", async () => {
    const onChange = setup({ disabled: true });
    await userEvent.click(screen.getByRole("button", { name: "Aumentar linhas" }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("anda de step em step, limitado por min e max", async () => {
    const onChange = setup({ value: 10, min: 0, max: 12, step: 5 });
    await userEvent.click(screen.getByRole("button", { name: "Aumentar linhas" }));
    await userEvent.click(screen.getByRole("button", { name: "Diminuir linhas" }));
    expect(onChange).toHaveBeenNthCalledWith(1, 12);
    expect(onChange).toHaveBeenNthCalledWith(2, 5);
  });

  it("mostra o valor formatado e evita erro de ponto flutuante nas casas decimais", async () => {
    const onChange = setup({
      value: 0.1,
      min: 0,
      max: 10,
      step: 0.2,
      decimals: 2,
      format: (valor) => `R$ ${valor.toFixed(2).replace(".", ",")}`,
    });
    expect(screen.getByText("R$ 0,10")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Aumentar linhas" }));
    expect(onChange).toHaveBeenCalledWith(0.3);
  });
});
