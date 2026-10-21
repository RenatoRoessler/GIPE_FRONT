import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";

const replace = vi.fn();
let aba: string | null = null;
let pagina: string | null = null;

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => ({ get: (key: string) => (key === "aba" ? aba : key === "pagina" ? pagina : null) }),
}));

vi.mock("@/lib/api/services/mensalista", () => ({
  listAllMensalistas: vi.fn().mockResolvedValue({ items: [], totalRecords: 0, truncado: false }),
  getContratoMensalista: vi.fn().mockResolvedValue(null),
  listTiposMensalidade: vi.fn().mockResolvedValue([]),
  listMensalistas: vi.fn().mockResolvedValue({ items: [], page: 1, pageSize: 20, totalRecords: 0, totalPages: 0 }),
}));

import { MensalistasPage } from "./MensalistasPage";

describe("MensalistasPage", () => {
  beforeEach(() => {
    replace.mockReset();
    aba = null;
    pagina = null;
  });

  it("mostra o título e as três abas, com a agenda ativa por padrão", () => {
    renderWithProviders(<MensalistasPage />);
    expect(screen.getByRole("heading", { name: "Mensalistas" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Agenda" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Lista" })).toHaveAttribute("aria-selected", "false");
    expect(screen.getByRole("tab", { name: "Tipos de mensalidade" })).toHaveAttribute("aria-selected", "false");
  });

  it("o endereço antigo com pagina e sem aba abre a lista", () => {
    pagina = "2";
    renderWithProviders(<MensalistasPage />);
    expect(screen.getByRole("tab", { name: "Lista" })).toHaveAttribute("aria-selected", "true");
  });

  it("ativa a aba indicada na URL", () => {
    aba = "tipos";
    renderWithProviders(<MensalistasPage />);
    expect(screen.getByRole("tab", { name: "Tipos de mensalidade" })).toHaveAttribute("aria-selected", "true");
  });

  it("trocar de aba atualiza a URL sem rolar a página", async () => {
    renderWithProviders(<MensalistasPage />);
    await userEvent.click(screen.getByRole("tab", { name: "Tipos de mensalidade" }));
    expect(replace).toHaveBeenCalledWith("/mensalistas?aba=tipos", { scroll: false });
    await userEvent.click(screen.getByRole("tab", { name: "Lista" }));
    expect(replace).toHaveBeenCalledWith("/mensalistas?aba=lista", { scroll: false });
  });

  describe("botão de novo mensalista na agenda", () => {
    it("há um botão no cabeçalho (tela larga) e um flutuante (celular), com o mesmo nome", () => {
      renderWithProviders(<MensalistasPage />);

      const botoes = screen.getAllByRole("button", { name: "Novo mensalista" });
      expect(botoes).toHaveLength(2);
      expect(botoes[0]).toHaveTextContent("Novo mensalista");
      expect(botoes[1]).toHaveTextContent("+ Novo");
      expect(botoes[1]).toHaveStyle({ position: "fixed" });
    });

    it.each(["lista", "tipos"])("na aba %s eles não aparecem no cabeçalho", (nome) => {
      aba = nome;
      renderWithProviders(<MensalistasPage />);

      expect(screen.queryByRole("button", { name: "+ Novo" })).not.toBeInTheDocument();
      expect(screen.queryByText("+ Novo")).not.toBeInTheDocument();
    });
  });

  it("voltar para a agenda limpa o parâmetro da URL", async () => {
    aba = "tipos";
    renderWithProviders(<MensalistasPage />);
    await userEvent.click(screen.getByRole("tab", { name: "Agenda" }));
    expect(replace).toHaveBeenCalledWith("/mensalistas", { scroll: false });
  });
});
