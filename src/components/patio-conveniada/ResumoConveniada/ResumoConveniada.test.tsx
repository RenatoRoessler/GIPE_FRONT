import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import type { ResumoPatioConveniada } from "@/types/patioConveniada";
import { ResumoConveniada } from "./ResumoConveniada";

const dois: ResumoPatioConveniada = {
  total: 3,
  porEstacionamento: [
    { empresaId: 37, nome: "teste 2", total: 2 },
    { empresaId: 40, nome: "centro", total: 1 },
  ],
};

describe("ResumoConveniada", () => {
  it("mostra o total e, com um só estacionamento, não mostra os chips", () => {
    renderWithProviders(
      <ResumoConveniada
        resumo={{ total: 1, porEstacionamento: [{ empresaId: 37, nome: "teste 2", total: 1 }] }}
        estacionamento={null}
        onEstacionamentoChange={vi.fn()}
      />,
    );
    expect(screen.getByText("veículo no pátio")).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Estacionamento" })).not.toBeInTheDocument();
  });

  it("com mais de um, mostra 'Todos' e cada estacionamento com a contagem", () => {
    renderWithProviders(<ResumoConveniada resumo={dois} estacionamento={null} onEstacionamentoChange={vi.fn()} />);
    expect(screen.getByText("veículos no pátio")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Todos\s*3/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /teste 2\s*2/ })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: /centro\s*1/ })).toBeInTheDocument();
  });

  it("escolher um estacionamento o filtra; tocar de novo no ativo volta a todos", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const { rerender } = renderWithProviders(<ResumoConveniada resumo={dois} estacionamento={null} onEstacionamentoChange={onChange} />);

    await user.click(screen.getByRole("button", { name: /centro/ }));
    expect(onChange).toHaveBeenLastCalledWith(40);

    rerender(<ResumoConveniada resumo={dois} estacionamento={40} onEstacionamentoChange={onChange} />);
    expect(screen.getByRole("button", { name: /centro/ })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: /centro/ }));
    expect(onChange).toHaveBeenLastCalledWith(null);

    await user.click(screen.getByRole("button", { name: /Todos/ }));
    expect(onChange).toHaveBeenLastCalledWith(null);
  });
});
