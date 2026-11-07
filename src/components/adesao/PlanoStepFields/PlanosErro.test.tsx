import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";
import { PlanosErro } from "./PlanosErro";

describe("PlanosErro", () => {
  it("avisa em linguagem simples, como alerta, sem jargão técnico", () => {
    renderWithTheme(<PlanosErro onRetry={() => {}} />);
    const alerta = screen.getByRole("alert");
    expect(alerta).toHaveTextContent("Não conseguimos carregar os planos");
    expect(alerta).toHaveTextContent("Tente de novo em instantes.");
    expect(alerta.textContent).not.toMatch(/API|servidor|erro \d{3}/i);
  });

  it("Tentar de novo chama onRetry", async () => {
    const onRetry = vi.fn();
    renderWithTheme(<PlanosErro onRetry={onRetry} />);
    await userEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("durante a nova tentativa muda o rótulo, marca aria-busy e mantém o foco no botão", async () => {
    const { rerender } = renderWithTheme(<PlanosErro onRetry={() => {}} />);
    const botao = screen.getByRole("button", { name: "Tentar de novo" });
    botao.focus();

    rerender(<PlanosErro onRetry={() => {}} refazendo />);

    const mesmo = screen.getByRole("button", { name: "Tentando de novo…" });
    expect(mesmo).toBe(botao);
    expect(mesmo).toHaveAttribute("aria-busy", "true");
    expect(mesmo).toHaveFocus();
  });

  it("não mostra nenhum preço", () => {
    renderWithTheme(<PlanosErro onRetry={() => {}} />);
    expect(document.body.textContent).not.toContain("R$");
  });
});
