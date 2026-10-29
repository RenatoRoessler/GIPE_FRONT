import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";

const modais = vi.hoisted(() => ({ abrirEntrada: vi.fn(), abrirSaida: vi.fn() }));
vi.mock("../VeiculoModais", () => ({ useVeiculoModais: () => modais }));
const permissao = vi.hoisted(() => ({ podeVerPatio: true }));
vi.mock("@/hooks/useCan", () => ({ useCan: () => permissao.podeVerPatio }));

import { RegistrarEntradaButton } from "./RegistrarEntradaButton";
import { RegistrarSaidaButton } from "../RegistrarSaidaButton/RegistrarSaidaButton";

describe("botões do Início", () => {
  beforeEach(() => {
    modais.abrirEntrada.mockReset();
    modais.abrirSaida.mockReset();
    permissao.podeVerPatio = true;
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

  it("sem permissão no pátio, nenhum dos dois botões aparece", () => {
    permissao.podeVerPatio = false;
    renderWithTheme(
      <>
        <RegistrarEntradaButton />
        <RegistrarSaidaButton />
      </>,
    );

    expect(screen.queryByRole("button", { name: /Registrar entrada/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Registrar saída/ })).not.toBeInTheDocument();
  });
});
