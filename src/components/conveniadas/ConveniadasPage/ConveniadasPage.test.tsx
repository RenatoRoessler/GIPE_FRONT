import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";

const push = vi.fn();
const replace = vi.fn();
let params: Record<string, string> = {};

// Router estável, como o do Next: um objeto novo a cada render refaria o efeito que lê o resultado do cadastro.
const router = { push, replace };
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  useSearchParams: () => ({ get: (key: string) => params[key] ?? null }),
}));
vi.mock("@/lib/api/services/conveniada", () => ({ listConveniadas: vi.fn().mockResolvedValue([]) }));

import { ConveniadasPage } from "./ConveniadasPage";

beforeEach(() => {
  push.mockReset();
  replace.mockReset();
  params = {};
});

describe("ConveniadasPage", () => {
  it("abre com o filtro Todos e leva ao cadastro", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ConveniadasPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Empresas conveniadas" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Todos" })).toBeChecked();
    await user.click(screen.getAllByRole("button", { name: "Nova conveniada" })[0]);
    expect(push).toHaveBeenCalledWith("/empresas-conveniadas/nova");
  });

  it("lê a situação da URL e a troca com router.replace", async () => {
    params = { situacao: "ativos" };
    const user = userEvent.setup();
    renderWithProviders(<ConveniadasPage />);

    expect(screen.getByRole("radio", { name: "Ativos" })).toBeChecked();
    await user.click(screen.getByRole("radio", { name: "Encerrados" }));
    expect(replace).toHaveBeenCalledWith("/empresas-conveniadas?situacao=encerrados", { scroll: false });
  });

  it("mostra o resultado do cadastro uma vez e limpa o parâmetro da URL", async () => {
    params = { cadastro: "10" };
    renderWithProviders(<ConveniadasPage />);

    expect(
      await screen.findByText(
        "Empresa cadastrada e convênio registrado. O usuário já cadastrado ganhou acesso a esta conveniada.",
      ),
    ).toBeInTheDocument();
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/empresas-conveniadas", { scroll: false }));
  });
});
