import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";

const sessao = vi.hoisted(() => ({
  atual: { user: { name: "Maria", perfil: 1 } as { name: string; perfil: number | null } | null, isLoading: false },
}));
vi.mock("@/contexts/CurrentUserContext", () => ({ useCurrentUser: () => sessao.atual }));

import { AcoesCaixa } from "./AcoesCaixa";

function renderizar(turnoPronto = true) {
  const props = { onSangria: vi.fn(), onTrocarTurno: vi.fn(), onFechar: vi.fn() };
  renderWithTheme(<AcoesCaixa turnoPronto={turnoPronto} {...props} />);
  return props;
}

beforeEach(() => {
  sessao.atual = { user: { name: "Maria", perfil: 1 }, isLoading: false };
});

describe("AcoesCaixa", () => {
  it.each([
    ["Administrador", 1],
    ["Gerente", 2],
    ["Caixa", 4],
  ])("%s vê Sangria, Lançar despesa desabilitado e Fechar caixa, sem Trocar turno", async (_nome, perfil) => {
    sessao.atual = { user: { name: "X", perfil }, isLoading: false };
    const props = renderizar();

    expect(screen.getByRole("button", { name: "Lançar despesa" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Lançar despesa" })).toHaveAttribute("title", "Em breve");
    expect(screen.queryByRole("button", { name: "Trocar turno" })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Sangria" }));
    await userEvent.click(screen.getByRole("button", { name: "Fechar caixa" }));
    expect(props.onSangria).toHaveBeenCalledTimes(1);
    expect(props.onFechar).toHaveBeenCalledTimes(1);
  });

  it("Manobrista vê Trocar turno e Fechar caixa, sem Sangria nem Lançar despesa", async () => {
    sessao.atual = { user: { name: "X", perfil: 3 }, isLoading: false };
    const props = renderizar();

    expect(screen.queryByRole("button", { name: "Sangria" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Lançar despesa" })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Trocar turno" }));
    expect(props.onTrocarTurno).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Fechar caixa" })).toBeEnabled();
  });

  it("sem turno as ações ficam desabilitadas", () => {
    renderizar(false);

    expect(screen.getByRole("button", { name: "Sangria" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Fechar caixa" })).toBeDisabled();
  });
});
