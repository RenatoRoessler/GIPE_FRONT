import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";

const modais = vi.hoisted(() => ({ abrirEntrada: vi.fn(), abrirSaida: vi.fn() }));
vi.mock("../VeiculoModais", () => ({ useVeiculoModais: () => modais }));

import { RegistrarEntradaButton } from "./RegistrarEntradaButton";
import { RegistrarSaidaButton } from "../RegistrarSaidaButton/RegistrarSaidaButton";

describe("botões do Início", () => {
  beforeEach(() => {
    modais.abrirEntrada.mockReset();
    modais.abrirSaida.mockReset();
  });

  it("\"Registrar entrada\" abre o modal de entrada pelo host", async () => {
    renderWithTheme(<RegistrarEntradaButton />);
    const botao = screen.getByRole("button", { name: /Registrar entrada/ });
    expect(botao).toHaveAttribute("aria-haspopup", "dialog");

    await userEvent.setup().click(botao);
    expect(modais.abrirEntrada).toHaveBeenCalledTimes(1);
    expect(modais.abrirSaida).not.toHaveBeenCalled();
  });

  it("\"Registrar saída\" abre o modal de saída pelo host", async () => {
    renderWithTheme(<RegistrarSaidaButton />);
    const botao = screen.getByRole("button", { name: /Registrar saída/ });
    expect(botao).toHaveAttribute("aria-haspopup", "dialog");

    await userEvent.setup().click(botao);
    expect(modais.abrirSaida).toHaveBeenCalledTimes(1);
    expect(modais.abrirEntrada).not.toHaveBeenCalled();
  });
});
