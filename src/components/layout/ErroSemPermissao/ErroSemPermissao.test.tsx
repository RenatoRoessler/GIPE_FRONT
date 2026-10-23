import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithTheme } from "@/test/render";
import { ErroSemPermissao } from "./ErroSemPermissao";

describe("ErroSemPermissao", () => {
  it("avisa da falta de permissão e leva ao início, sem oferecer nova tentativa", () => {
    renderWithTheme(<ErroSemPermissao />);

    expect(screen.getByRole("alert")).toHaveTextContent("Você não tem permissão para acessar esta página.");
    expect(screen.getByRole("link", { name: "Ir para o início" })).toHaveAttribute("href", "/dashboard");
    expect(screen.queryByRole("button", { name: /tentar novamente/i })).not.toBeInTheDocument();
  });

  it("aceita outra mensagem", () => {
    renderWithTheme(<ErroSemPermissao message="Sem acesso aos usuários." />);

    expect(screen.getByRole("alert")).toHaveTextContent("Sem acesso aos usuários.");
  });
});
