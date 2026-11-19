import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// A página em si é testada à parte: aqui só interessa o que a rota monta e o título da aba.
vi.mock("@/components/dashboard/DashboardPage", () => ({ DashboardPage: () => <div data-testid="visao-geral" /> }));

import Page, { metadata } from "./page";

describe("rota /dashboard (Visão Geral)", () => {
  it("monta a Visão Geral", () => {
    render(<Page />);

    expect(screen.getByTestId("visao-geral")).toBeInTheDocument();
  });

  it("não traz mais os atalhos de entrada, saída, cartaz e tour", () => {
    render(<Page />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("título da aba", () => {
    expect(metadata.title).toBe("Visão Geral — Murel");
  });
});
