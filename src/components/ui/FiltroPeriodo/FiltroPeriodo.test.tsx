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

  describe("períodos prontos", () => {
    const atalhos = [
      { id: "mes", label: "Este mês", periodo: { de: "2026-10-01", ate: "2026-10-31" } },
      { id: "anterior", label: "Mês anterior", periodo: { de: "2026-09-01", ate: "2026-09-30" } },
    ];

    it("sem atalhos, não mostra o grupo", () => {
      renderFiltro();
      expect(screen.queryByRole("group", { name: "Períodos prontos" })).not.toBeInTheDocument();
    });

    it("escolher um atalho aplica na hora e preenche as datas", async () => {
      const { onAplicar } = renderFiltro({ atalhos });

      await userEvent.setup().click(screen.getByRole("button", { name: "Mês anterior" }));

      expect(onAplicar).toHaveBeenCalledWith({ de: "2026-09-01", ate: "2026-09-30" });
      expect(de()).toHaveValue("2026-09-01");
      expect(ate()).toHaveValue("2026-09-30");
    });

    it("marca o atalho cujas datas estão nos campos e desmarca ao editar à mão", () => {
      renderFiltro({ periodo: { de: "2026-10-01", ate: "2026-10-31" }, atalhos });
      expect(screen.getByRole("button", { name: "Este mês" })).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByRole("button", { name: "Mês anterior" })).toHaveAttribute("aria-pressed", "false");

      definir(ate(), "2026-10-30");

      expect(screen.getByRole("button", { name: "Este mês" })).toHaveAttribute("aria-pressed", "false");
    });

    it("atalho que passa do limite de dias mostra o erro e não aplica", async () => {
      const { onAplicar } = renderFiltro({ maxDias: 10, atalhos });

      await userEvent.setup().click(screen.getByRole("button", { name: "Este mês" }));

      expect(screen.getByText("Escolha um período de até 10 dias")).toBeInTheDocument();
      expect(onAplicar).not.toHaveBeenCalled();
    });

    it("desabilitado trava os atalhos", () => {
      renderFiltro({ atalhos, disabled: true });
      expect(screen.getByRole("button", { name: "Este mês" })).toBeDisabled();
    });
  });

  it("recusa período acima do limite de dias no campo final", async () => {
    const { onAplicar } = renderFiltro({ maxDias: 366 });

    definir(de(), "2026-01-10");
    definir(ate(), "2027-01-11");
    await userEvent.setup().click(screen.getByRole("button", { name: "Filtrar" }));

    expect(screen.getByText("Escolha um período de até 366 dias")).toBeInTheDocument();
    expect(onAplicar).not.toHaveBeenCalled();
  });

  it("no modo opcional, aceita os campos vazios", async () => {
    const { onAplicar } = renderFiltro({ obrigatorio: false });

    definir(de(), "");
    definir(ate(), "");
    await userEvent.setup().click(screen.getByRole("button", { name: "Filtrar" }));

    expect(onAplicar).toHaveBeenCalledWith({ de: "", ate: "" });
  });

  it("usa o rótulo do botão que a tela pedir", () => {
    renderFiltro({ rotuloAplicar: "Aplicar" });
    expect(screen.getByRole("button", { name: "Aplicar" })).toBeInTheDocument();
  });

  it("quando o período aplicado muda por fora, os campos acompanham", () => {
    const { rerender } = renderWithTheme(<FiltroPeriodo periodo={periodo} onAplicar={vi.fn()} />);
    rerender(<FiltroPeriodo periodo={{ de: "2026-08-01", ate: "2026-08-31" }} onAplicar={vi.fn()} />);

    expect(de()).toHaveValue("2026-08-01");
    expect(ate()).toHaveValue("2026-08-31");
  });

  describe("campos recolhidos", () => {
    it("as datas ficam num bloco \"Personalizar período\", fechado por padrão", async () => {
      renderFiltro({ recolherCampos: true });
      const gatilho = screen.getByRole("button", { name: "Personalizar período" });

      expect(gatilho).toHaveAttribute("aria-expanded", "false");
      expect(de()).not.toBeVisible();

      await userEvent.setup().click(gatilho);

      expect(gatilho).toHaveAttribute("aria-expanded", "true");
      expect(de()).toBeVisible();
    });

    it("sem a opção, as datas ficam à mostra", () => {
      renderFiltro();
      expect(screen.queryByRole("button", { name: "Personalizar período" })).not.toBeInTheDocument();
      expect(de()).toBeVisible();
    });
  });
});
