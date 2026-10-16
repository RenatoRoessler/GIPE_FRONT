import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";

const replace = vi.fn();
let aba: string | null = null;

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => ({ get: (key: string) => (key === "aba" ? aba : null) }),
}));

vi.mock("@/lib/api/services/mensalista", () => ({
  listTiposMensalidade: vi.fn().mockResolvedValue([]),
  listMensalistas: vi.fn().mockResolvedValue({ items: [], page: 1, pageSize: 20, totalRecords: 0, totalPages: 0 }),
}));

import { MensalistasPage } from "./MensalistasPage";

describe("MensalistasPage", () => {
  beforeEach(() => {
    replace.mockReset();
    aba = null;
  });

  it("mostra o título e as duas abas, com mensalistas ativa por padrão", () => {
    renderWithProviders(<MensalistasPage />);
    expect(screen.getByRole("heading", { name: "Mensalistas" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Mensalistas" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Tipos de mensalidade" })).toHaveAttribute("aria-selected", "false");
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
  });
});
