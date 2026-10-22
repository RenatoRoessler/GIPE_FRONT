import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";
import { FiltroPeriodo } from "./FiltroPeriodo";

const periodo = { de: "2026-10-01", ate: "2026-10-23" };

function renderFiltro(props: Partial<React.ComponentProps<typeof FiltroPeriodo>> = {}) {
  const onAplicar = vi.fn();
  renderWithTheme(<FiltroPeriodo periodo={periodo} onAplicar={onAplicar} {...props} />);
  return { onAplicar };
}

const de = () => screen.getByLabelText("De");
const ate = () => screen.getByLabelText("Até");

// Campos de data não aceitam digitação por user-event: o valor é trocado como o navegador faria.
function definir(campo: HTMLElement, valor: string) {
  fireEvent.change(campo, { target: { value: valor } });
}

describe("FiltroPeriodo", () => {
  it("começa com o período aplicado nos campos", () => {
    renderFiltro();
    expect(de()).toHaveValue("2026-10-01");
    expect(ate()).toHaveValue("2026-10-23");
  });

  it("aplicar entrega o período escolhido", async () => {
    const { onAplicar } = renderFiltro();

    definir(de(), "2026-09-15");
    definir(ate(), "2026-09-30");
    await userEvent.setup().click(screen.getByRole("button", { name: "Filtrar" }));

    expect(onAplicar).toHaveBeenCalledWith({ de: "2026-09-15", ate: "2026-09-30" });
  });

  it("alterar os campos sem filtrar não aplica nada", () => {
    const { onAplicar } = renderFiltro();
    definir(de(), "2026-09-15");
    expect(onAplicar).not.toHaveBeenCalled();
  });

  it("data final antes da inicial mostra o erro no campo e não aplica", async () => {
    const { onAplicar } = renderFiltro();

    definir(ate(), "2026-09-01");
    await userEvent.setup().click(screen.getByRole("button", { name: "Filtrar" }));

    expect(screen.getByText("A data final deve ser igual ou posterior à inicial")).toBeInTheDocument();
    expect(ate()).toHaveAttribute("aria-invalid", "true");
    expect(onAplicar).not.toHaveBeenCalled();
  });

  it("campo vazio mostra o erro naquele campo", async () => {
    const { onAplicar } = renderFiltro();

    definir(de(), "");
    await userEvent.setup().click(screen.getByRole("button", { name: "Filtrar" }));

    expect(screen.getByText("Informe a data inicial")).toBeInTheDocument();
    expect(onAplicar).not.toHaveBeenCalled();
  });

  it("corrigir o campo limpa o erro dele", async () => {
    renderFiltro();

    definir(ate(), "2026-09-01");
    await userEvent.setup().click(screen.getByRole("button", { name: "Filtrar" }));
    expect(screen.getByText("A data final deve ser igual ou posterior à inicial")).toBeInTheDocument();

    definir(ate(), "2026-10-30");
    expect(screen.queryByText("A data final deve ser igual ou posterior à inicial")).not.toBeInTheDocument();
  });

  it("desabilitado trava os campos e o botão", () => {
    renderFiltro({ disabled: true });
    expect(de()).toBeDisabled();
    expect(ate()).toBeDisabled();
    expect(screen.getByRole("button", { name: "Filtrar" })).toBeDisabled();
  });
});
