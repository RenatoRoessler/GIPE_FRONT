import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";
import { AcessoNegado } from "./AcessoNegado";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

describe("AcessoNegado", () => {
  beforeEach(() => {
    push.mockClear();
  });

  it("mostra o título, a orientação e o botão de volta", () => {
    renderWithTheme(<AcessoNegado />);

    expect(screen.getByRole("heading", { level: 1, name: "Você não tem acesso a esta área" })).toBeInTheDocument();
    expect(screen.getByText(/fale com o administrador da empresa/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ir para o início" })).toBeInTheDocument();
  });

  it("leva o foco ao título ao abrir", () => {
    renderWithTheme(<AcessoNegado />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveFocus();
  });

  it("o botão leva ao início", async () => {
    renderWithTheme(<AcessoNegado />);

    await userEvent.click(screen.getByRole("button", { name: "Ir para o início" }));

    expect(push).toHaveBeenCalledWith("/dashboard");
  });
});
