import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";

const logout = vi.fn();
vi.mock("@/hooks/useLogout", () => ({ useLogout: () => logout }));

import { EmpresaCriada } from "./EmpresaCriada";

beforeEach(() => {
  logout.mockReset();
});

describe("EmpresaCriada", () => {
  it("confirma a criação, mostra o nome da empresa e explica como entrar nela", () => {
    renderWithTheme(<EmpresaCriada nome="Estacionamento Norte LTDA" onVoltar={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Empresa criada" })).toBeInTheDocument();
    expect(screen.getByText("Estacionamento Norte LTDA")).toBeInTheDocument();
    expect(screen.getByText(/saia e faça login de novo/)).toBeInTheDocument();
    expect(screen.getByText(/escolher em qual empresa/)).toBeInTheDocument();
  });

  it("é anunciado como status e leva o foco para o título", () => {
    renderWithTheme(<EmpresaCriada nome="Norte" onVoltar={vi.fn()} />);

    expect(screen.getByRole("status")).toHaveAccessibleName("Empresa criada");
    expect(screen.getByRole("heading", { name: "Empresa criada" })).toHaveFocus();
  });

  it("Sair e escolher a empresa encerra a sessão", async () => {
    renderWithTheme(<EmpresaCriada nome="Norte" onVoltar={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: "Sair e escolher a empresa" }));

    expect(logout).toHaveBeenCalledTimes(1);
  });

  it("Voltar para Minha empresa chama onVoltar e não encerra a sessão", async () => {
    const onVoltar = vi.fn();
    renderWithTheme(<EmpresaCriada nome="Norte" onVoltar={onVoltar} />);

    await userEvent.click(screen.getByRole("button", { name: "Voltar para Minha empresa" }));

    expect(onVoltar).toHaveBeenCalledTimes(1);
    expect(logout).not.toHaveBeenCalled();
  });

  it("não oferece criar outra empresa daqui", () => {
    renderWithTheme(<EmpresaCriada nome="Norte" onVoltar={vi.fn()} />);

    expect(screen.queryByRole("button", { name: /outra/i })).not.toBeInTheDocument();
  });
});
