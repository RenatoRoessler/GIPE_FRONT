import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithTheme } from "@/test/render";
import { DashboardSkeleton } from "./DashboardSkeleton";

describe("DashboardSkeleton", () => {
  it("é um status que avisa que a visão geral está carregando", () => {
    renderWithTheme(<DashboardSkeleton />);

    expect(screen.getByRole("status", { name: "Carregando a visão geral" })).toBeInTheDocument();
    expect(screen.getByText("Carregando a visão geral…")).toBeInTheDocument();
  });

  it("não traz títulos nem números: os blocos de carregamento são decorativos", () => {
    const { container } = renderWithTheme(<DashboardSkeleton />);

    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
    expect(container.querySelectorAll("[aria-hidden='true']").length).toBeGreaterThanOrEqual(10);
  });

  it("tem um bloco para cada painel da página: 2 + 3 + 2 + 4", () => {
    const { container } = renderWithTheme(<DashboardSkeleton />);

    // Cada bloco é um painel decorativo (div aria-hidden) com o rótulo e as linhas dentro.
    const blocos = Array.from(container.querySelectorAll("div[aria-hidden='true']")).filter((no) => no.parentElement?.getAttribute("aria-hidden") !== "true");
    expect(blocos).toHaveLength(11);
  });
});
