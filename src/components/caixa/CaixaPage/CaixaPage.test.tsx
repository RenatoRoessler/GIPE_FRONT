import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/render";

const caixa = vi.hoisted(() => ({ atual: {} as Record<string, unknown> }));
vi.mock("../useCaixa", () => ({ useCaixa: () => caixa.atual }));

import { CaixaPage } from "./CaixaPage";

const consulta = (extra: Record<string, unknown>) => ({ isPending: false, isError: false, isFetching: false, refetch: vi.fn(), ...extra });

beforeEach(() => {
  caixa.atual = {};
});

describe("CaixaPage: erro de permissão", () => {
  it("no 403 do caixa avisa da permissão e não oferece nova tentativa", () => {
    caixa.atual = { caixaQuery: consulta({ isError: true, error: new ApiError("forbidden") }), caixa: null, turnoQuery: consulta({}) };
    renderWithProviders(<CaixaPage />);

    expect(screen.getByRole("alert")).toHaveTextContent("Você não tem permissão para acessar esta página.");
    expect(screen.getByRole("link", { name: "Ir para o início" })).toHaveAttribute("href", "/dashboard");
    expect(screen.queryByRole("button", { name: "Tentar novamente" })).not.toBeInTheDocument();
  });

  it("em outros erros do caixa mostra a mensagem e oferece nova tentativa", () => {
    caixa.atual = { caixaQuery: consulta({ isError: true, error: new ApiError("server") }), caixa: null, turnoQuery: consulta({}) };
    renderWithProviders(<CaixaPage />);

    expect(screen.getByRole("alert")).toHaveTextContent("Erro no servidor. Tente novamente em instantes.");
    expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeInTheDocument();
  });
});
