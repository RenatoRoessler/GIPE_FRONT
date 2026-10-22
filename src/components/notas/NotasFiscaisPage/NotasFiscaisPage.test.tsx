import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/render";
import type { NotaFiscal } from "@/types/notaFiscal";

const router = vi.hoisted(() => ({ replace: vi.fn() }));
const busca = vi.hoisted(() => ({ aba: null as string | null }));
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  useSearchParams: () => new URLSearchParams(busca.aba ? `aba=${busca.aba}` : ""),
}));
vi.mock("@/lib/api/services/notaFiscal", () => ({ listNotasPendentes: vi.fn(), listNotasLancadas: vi.fn() }));

import { listNotasLancadas, listNotasPendentes } from "@/lib/api/services/notaFiscal";
import { NotasFiscaisPage } from "./NotasFiscaisPage";

function nota(extra: Partial<NotaFiscal> = {}): NotaFiscal {
  return {
    notaFiscalId: 1,
    valor: 100,
    dataSolicitacao: "2026-10-22T10:00:00",
    dataLancamento: null,
    documento: null,
    email: "maria@exemplo.com",
    placa: null,
    ...extra,
  };
}

// Congela só o relógio (a data de "hoje"); os timers continuam reais para a consulta e o userEvent funcionarem.
function fixarHoje() {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 9, 23, 12));
}

describe("NotasFiscaisPage", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    router.replace.mockReset();
    busca.aba = null;
    vi.mocked(listNotasPendentes).mockReset();
    vi.mocked(listNotasLancadas).mockReset();
  });

  it("abre nas pendentes, com título e as duas abas", async () => {
    vi.mocked(listNotasPendentes).mockResolvedValue([nota()]);
    renderWithProviders(<NotasFiscaisPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Notas Fiscais" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Pendentes" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Lançadas" })).toHaveAttribute("aria-selected", "false");
    expect(await screen.findByText("maria@exemplo.com")).toBeInTheDocument();
    expect(listNotasLancadas).not.toHaveBeenCalled();
  });

  it("trocar de aba atualiza a URL", async () => {
    vi.mocked(listNotasPendentes).mockResolvedValue([]);
    renderWithProviders(<NotasFiscaisPage />);

    await userEvent.setup().click(screen.getByRole("tab", { name: "Lançadas" }));
    expect(router.replace).toHaveBeenCalledWith("/notas-fiscais?aba=lancadas", { scroll: false });
  });

  it("pendentes vazias mostram o estado vazio", async () => {
    vi.mocked(listNotasPendentes).mockResolvedValue([]);
    renderWithProviders(<NotasFiscaisPage />);
    expect(await screen.findByText("Nenhuma nota pendente.")).toBeInTheDocument();
  });

  it("acesso negado nas pendentes mostra só o aviso de permissão", async () => {
    vi.mocked(listNotasPendentes).mockRejectedValue(new ApiError("forbidden", undefined, 403));
    renderWithProviders(<NotasFiscaisPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Você não tem permissão para acessar esta página.");
    expect(screen.queryByText("maria@exemplo.com")).not.toBeInTheDocument();
  });

  it("erro nas pendentes deixa tentar de novo", async () => {
    vi.mocked(listNotasPendentes).mockRejectedValueOnce(new ApiError("server", "Falhou.", 500));
    renderWithProviders(<NotasFiscaisPage />);

    await screen.findByRole("alert");
    vi.mocked(listNotasPendentes).mockResolvedValue([nota()]);
    await userEvent.setup().click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByText("maria@exemplo.com")).toBeInTheDocument();
  });

  it("lançadas: consulta o mês atual, até hoje, ao abrir", async () => {
    busca.aba = "lancadas";
    fixarHoje();
    vi.mocked(listNotasLancadas).mockResolvedValue([nota({ dataLancamento: "2026-10-10T10:00:00" })]);
    renderWithProviders(<NotasFiscaisPage />);

    expect(screen.getByRole("tab", { name: "Lançadas" })).toHaveAttribute("aria-selected", "true");
    await waitFor(() => expect(listNotasLancadas).toHaveBeenCalledWith({ de: "2026-10-01", ate: "2026-10-23" }));
    expect(listNotasPendentes).not.toHaveBeenCalled();
    expect(await screen.findByText("1 nota lançada no período")).toBeInTheDocument();
  });

  it("lançadas: aplicar outro período consulta de novo com as novas datas", async () => {
    busca.aba = "lancadas";
    fixarHoje();
    vi.mocked(listNotasLancadas).mockResolvedValue([]);
    renderWithProviders(<NotasFiscaisPage />);
    await screen.findByText("Nenhuma nota lançada neste período.");

    fireEvent.change(screen.getByLabelText("De"), { target: { value: "2026-09-01" } });
    fireEvent.change(screen.getByLabelText("Até"), { target: { value: "2026-09-30" } });
    await userEvent.setup().click(screen.getByRole("button", { name: "Filtrar" }));

    await waitFor(() => expect(listNotasLancadas).toHaveBeenLastCalledWith({ de: "2026-09-01", ate: "2026-09-30" }));
  });

  it("lançadas: período inválido não consulta", async () => {
    busca.aba = "lancadas";
    fixarHoje();
    vi.mocked(listNotasLancadas).mockResolvedValue([]);
    renderWithProviders(<NotasFiscaisPage />);
    await screen.findByText("Nenhuma nota lançada neste período.");
    const consultasAntes = vi.mocked(listNotasLancadas).mock.calls.length;

    fireEvent.change(screen.getByLabelText("Até"), { target: { value: "2026-09-01" } });
    await userEvent.setup().click(screen.getByRole("button", { name: "Filtrar" }));

    expect(screen.getByText("A data final deve ser igual ou posterior à inicial")).toBeInTheDocument();
    expect(vi.mocked(listNotasLancadas).mock.calls).toHaveLength(consultasAntes);
  });
});
