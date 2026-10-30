import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";

const replace = vi.fn();
let parametros: Record<string, string> = {};

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => ({ get: (chave: string) => parametros[chave] ?? null }),
}));

import { FinanceiroPage } from "./FinanceiroPage";

describe("FinanceiroPage", () => {
  beforeEach(() => {
    replace.mockReset();
    parametros = {};
  });

  it("mostra o título e as três abas, com o fluxo de caixa ativo por padrão", () => {
    renderWithProviders(<FinanceiroPage />);

    expect(screen.getByRole("heading", { name: "Financeiro" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Fluxo de caixa" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Lançamentos" })).toHaveAttribute("aria-selected", "false");
    expect(screen.getByRole("tab", { name: "Categorias" })).toHaveAttribute("aria-selected", "false");
  });

  it.each([
    ["lancamentos", "Lançamentos"],
    ["categorias", "Categorias"],
  ])("ativa a aba %s indicada na URL", (aba, nome) => {
    parametros = { aba };
    renderWithProviders(<FinanceiroPage />);

    expect(screen.getByRole("tab", { name: nome })).toHaveAttribute("aria-selected", "true");
  });

  it("aba desconhecida na URL cai no fluxo de caixa", () => {
    parametros = { aba: "outra" };
    renderWithProviders(<FinanceiroPage />);

    expect(screen.getByRole("tab", { name: "Fluxo de caixa" })).toHaveAttribute("aria-selected", "true");
  });

  it("trocar de aba atualiza a URL sem rolar a página e sem levar os filtros da outra", async () => {
    parametros = { de: "2026-09-01", ate: "2026-09-30" };
    renderWithProviders(<FinanceiroPage />);

    await userEvent.click(screen.getByRole("tab", { name: "Lançamentos" }));
    expect(replace).toHaveBeenLastCalledWith("/financeiro?aba=lancamentos", { scroll: false });

    await userEvent.click(screen.getByRole("tab", { name: "Categorias" }));
    expect(replace).toHaveBeenLastCalledWith("/financeiro?aba=categorias", { scroll: false });
  });

  it("voltar ao fluxo leva ao endereço sem parâmetros", async () => {
    parametros = { aba: "lancamentos" };
    renderWithProviders(<FinanceiroPage />);

    await userEvent.click(screen.getByRole("tab", { name: "Fluxo de caixa" }));

    expect(replace).toHaveBeenLastCalledWith("/financeiro", { scroll: false });
  });

  it("o botão do cabeçalho é Novo lançamento no fluxo e nos lançamentos, e Nova categoria nas categorias", () => {
    const { unmount } = renderWithProviders(<FinanceiroPage />);
    expect(screen.getByRole("button", { name: "Novo lançamento" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Nova categoria" })).not.toBeInTheDocument();
    unmount();

    parametros = { aba: "lancamentos" };
    const outra = renderWithProviders(<FinanceiroPage />);
    expect(screen.getByRole("button", { name: "Novo lançamento" })).toBeInTheDocument();
    outra.unmount();

    parametros = { aba: "categorias" };
    renderWithProviders(<FinanceiroPage />);
    expect(screen.getByRole("button", { name: "Nova categoria" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Novo lançamento" })).not.toBeInTheDocument();
  });
});
