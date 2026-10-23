import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { ThemeProvider } from "styled-components";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { lightTheme } from "@/styles/theme";
import type { CaixaFechado, Movimento } from "@/types/caixa";

vi.mock("@/lib/api/services/caixa", () => ({ listMovimentosCaixa: vi.fn() }));
vi.mock("../exportCsv", async (importOriginal) => ({ ...(await importOriginal<typeof import("../exportCsv")>()), baixarCsv: vi.fn() }));
vi.mock("../pdf/extratoPdf", () => ({ baixarExtratoPdf: vi.fn() }));
vi.mock("@/contexts/CurrentUserContext", () => ({ useCurrentUser: () => ({ user: { name: "Admin", perfil: 2 }, isLoading: false }) }));

import { listMovimentosCaixa } from "@/lib/api/services/caixa";
import { baixarCsv } from "../exportCsv";
import { baixarExtratoPdf } from "../pdf/extratoPdf";
import { ExtratoCaixaPage } from "./ExtratoCaixaPage";

let seq = 1;
function mov(extra: Partial<Movimento> = {}): Movimento {
  return {
    movimentoId: seq++,
    dataHora: "2026-10-12T09:00:00",
    tipo: "entrada",
    valor: 100,
    formaPagamento: 1,
    turnoId: 1,
    usuario: "Ana",
    motivo: null,
    ...extra,
  };
}

const movimentos = [
  mov({ valor: 100 }),
  mov({ tipo: "saida", valor: 30, turnoId: 2, usuario: "Beto", dataHora: "2026-10-12T14:00:00" }),
  mov({ tipo: "sangria", valor: 50, turnoId: 2, usuario: "Beto", motivo: "Cofre", dataHora: "2026-10-12T15:00:00" }),
];

const doHistorico: CaixaFechado = {
  caixaId: 12,
  dataHoraAbertura: "2026-10-12T08:00:00",
  dataHoraFechamento: "2026-10-12T18:30:00",
  valorFundoCaixa: 100,
  valorTotalEntrada: 100,
  valorTotalSaida: 80,
  abriu: "Ana",
  fechou: "Beto",
};

function renderPagina(caixaId = 12, queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={lightTheme}>{children}</ThemeProvider>
    </QueryClientProvider>
  );
  return { queryClient, ...render(<ExtratoCaixaPage caixaId={caixaId} />, { wrapper }) };
}

const linhas = () => screen.getAllByRole("row").slice(1);

beforeEach(() => {
  vi.mocked(listMovimentosCaixa).mockReset();
  vi.mocked(baixarCsv).mockReset();
  vi.mocked(baixarExtratoPdf).mockReset();
});

describe("ExtratoCaixaPage", () => {
  it("lista os movimentos do caixa e soma entradas e saídas", async () => {
    vi.mocked(listMovimentosCaixa).mockResolvedValue(movimentos);
    renderPagina();

    expect(await screen.findByRole("heading", { name: "Extrato do caixa 12" })).toBeInTheDocument();
    expect(await screen.findAllByRole("row")).toHaveLength(4);
    expect(listMovimentosCaixa).toHaveBeenCalledWith(12);
    const resumo = within(screen.getByRole("region", { name: "Resumo do caixa" }));
    expect(resumo.getByText("Entradas").closest("div")).toHaveTextContent("R$ 100,00");
    expect(resumo.getByText("Saídas e retiradas").closest("div")).toHaveTextContent("R$ 80,00");
    expect(screen.getByRole("link", { name: "Voltar aos caixas anteriores" })).toHaveAttribute("href", "/caixa/historico");
  });

  it("mostra quem abriu e fechou quando a pessoa veio pela lista do histórico", async () => {
    vi.mocked(listMovimentosCaixa).mockResolvedValue(movimentos);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClient.setQueryData(["caixa", "historico", { dataInicio: "", dataFim: "", pagina: 1 }], { items: [doHistorico], page: 1, pageSize: 20, totalRecords: 1, totalPages: 1 });
    renderPagina(12, queryClient);

    await screen.findAllByRole("row");
    expect(screen.getByText("Aberto em").closest("div")).toHaveTextContent("por Ana");
    expect(screen.getByText("Fechado em").closest("div")).toHaveTextContent("por Beto");
    expect(screen.getByText("Fundo de caixa").closest("div")).toHaveTextContent("R$ 100,00");
  });

  it("abrindo direto pelo endereço não inventa dados do caixa", async () => {
    vi.mocked(listMovimentosCaixa).mockResolvedValue(movimentos);
    renderPagina();

    await screen.findAllByRole("row");
    expect(screen.queryByText("Aberto em")).not.toBeInTheDocument();
    expect(screen.queryByText("Fundo de caixa")).not.toBeInTheDocument();
  });

  it("filtra por tipo e por turno (turnos vêm dos próprios movimentos)", async () => {
    vi.mocked(listMovimentosCaixa).mockResolvedValue(movimentos);
    const user = userEvent.setup();
    renderPagina();
    await screen.findAllByRole("row");

    await user.click(screen.getByRole("button", { name: /Sangrias/ }));
    expect(linhas()).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: /Todos/ }));
    await user.selectOptions(screen.getByLabelText("Turno"), "2");
    expect(linhas()).toHaveLength(2);
  });

  it("baixa o CSV de tudo, e do que está filtrado com o rótulo avisando", async () => {
    vi.mocked(listMovimentosCaixa).mockResolvedValue(movimentos);
    const user = userEvent.setup();
    renderPagina();
    await screen.findAllByRole("row");

    await user.click(screen.getByRole("button", { name: "Baixar CSV" }));
    expect(baixarCsv).toHaveBeenLastCalledWith("extrato-caixa-12", expect.stringContaining("Cofre"));
    expect(vi.mocked(baixarCsv).mock.calls[0][1].split("\r\n").filter(Boolean)).toHaveLength(4);

    await user.click(screen.getByRole("button", { name: /Entradas/ }));
    await user.click(screen.getByRole("button", { name: "Baixar CSV (filtrado)" }));
    const csvFiltrado = vi.mocked(baixarCsv).mock.calls[1][1];
    expect(csvFiltrado.split("\r\n").filter(Boolean)).toHaveLength(2);
    expect(csvFiltrado).not.toContain("Cofre");
  });

  it("baixa o PDF só com o que está filtrado e mostra Gerando… enquanto espera", async () => {
    vi.mocked(listMovimentosCaixa).mockResolvedValue(movimentos);
    let terminar: () => void = () => {};
    vi.mocked(baixarExtratoPdf).mockImplementation(() => new Promise<void>((resolve) => (terminar = resolve)));
    const user = userEvent.setup();
    renderPagina();
    await screen.findAllByRole("row");
    await user.click(screen.getByRole("button", { name: /Sangrias/ }));

    await user.click(screen.getByRole("button", { name: "Baixar PDF (filtrado)" }));

    const entrada = vi.mocked(baixarExtratoPdf).mock.calls[0][0];
    expect(entrada.caixa).toEqual({ caixaId: 12 });
    expect(entrada.movimentos).toHaveLength(1);
    expect(entrada.filtro).toBe("filtros aplicados na tela");
    expect(screen.getByRole("button", { name: "Gerando…" })).toBeDisabled();

    terminar();
    expect(await screen.findByRole("button", { name: "Baixar PDF (filtrado)" })).toBeEnabled();
  });

  it("falha ao gerar o PDF avisa e mantém o extrato", async () => {
    vi.mocked(listMovimentosCaixa).mockResolvedValue(movimentos);
    vi.mocked(baixarExtratoPdf).mockRejectedValue(new Error("falhou"));
    const user = userEvent.setup();
    renderPagina();
    await screen.findAllByRole("row");

    await user.click(screen.getByRole("button", { name: "Baixar PDF" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível gerar o PDF");
    expect(linhas()).toHaveLength(3);
  });

  it("caixa sem movimentos mostra a mensagem própria", async () => {
    vi.mocked(listMovimentosCaixa).mockResolvedValue([]);
    renderPagina();

    expect(await screen.findByText("Este caixa não teve movimentos.")).toBeInTheDocument();
  });

  it("caixa não encontrado (404) tem tela própria com link de volta", async () => {
    vi.mocked(listMovimentosCaixa).mockRejectedValue(new ApiError("not_found"));
    renderPagina(99);

    expect(await screen.findByRole("heading", { name: "Caixa não encontrado" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Voltar aos caixas anteriores" })).toBeInTheDocument();
  });

  it("caixa ainda aberto (400) mostra a mensagem da API e leva ao caixa", async () => {
    vi.mocked(listMovimentosCaixa).mockRejectedValue(new ApiError("validation", "O caixa ainda está aberto."));
    renderPagina();

    expect(await screen.findByRole("alert")).toHaveTextContent("O caixa ainda está aberto.");
    expect(screen.getByRole("link", { name: "Ir para o caixa aberto" })).toHaveAttribute("href", "/caixa");
  });

  it("erro de servidor permite tentar de novo e 403 mostra o aviso de permissão", async () => {
    vi.mocked(listMovimentosCaixa).mockRejectedValueOnce(new ApiError("server"));
    const user = userEvent.setup();
    const { unmount } = renderPagina();
    expect(await screen.findByRole("alert")).toHaveTextContent("Erro no servidor");

    vi.mocked(listMovimentosCaixa).mockResolvedValue(movimentos);
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect((await screen.findAllByRole("row")).length).toBeGreaterThan(1);
    unmount();

    vi.mocked(listMovimentosCaixa).mockRejectedValue(new ApiError("forbidden"));
    renderPagina();
    expect(await screen.findByText("Você não tem permissão para acessar esta página.")).toBeInTheDocument();
  });
});
