import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/render";
import type { CaixaFechado } from "@/types/caixa";
import { historicoUrl, lerData, lerPagina } from "./historicoUrl";

vi.mock("@/lib/api/services/caixa", () => ({ listHistoricoCaixas: vi.fn() }));

const nav = vi.hoisted(() => ({ query: "", replace: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: nav.replace }),
  useSearchParams: () => new URLSearchParams(nav.query),
}));

import { listHistoricoCaixas } from "@/lib/api/services/caixa";
import { HistoricoCaixasPage } from "./HistoricoCaixasPage";

function caixa(id: number, extra: Partial<CaixaFechado> = {}): CaixaFechado {
  return {
    caixaId: id,
    dataHoraAbertura: "2026-10-12T08:00:00",
    dataHoraFechamento: "2026-10-12T18:30:00",
    valorFundoCaixa: 100,
    valorTotalEntrada: 900,
    valorTotalSaida: 200,
    valorTotalFechamento: 800,
    abriu: "Ana",
    fechou: "Beto",
    ...extra,
  };
}

function pagina(items: CaixaFechado[], extra: Partial<{ page: number; totalPages: number; totalRecords: number }> = {}) {
  return { items, page: 1, pageSize: 20, totalRecords: items.length, totalPages: 1, ...extra };
}

beforeEach(() => {
  nav.query = "";
  nav.replace.mockReset();
  vi.mocked(listHistoricoCaixas).mockReset();
});

describe("historicoUrl", () => {
  it("omite o que está vazio ou é padrão", () => {
    expect(historicoUrl({ de: "", ate: "", pagina: 1 })).toBe("/caixa/historico");
    expect(historicoUrl({ de: "2026-10-01", ate: "", pagina: 1 })).toBe("/caixa/historico?de=2026-10-01");
    expect(historicoUrl({ de: "2026-10-01", ate: "2026-10-31", pagina: 3 })).toBe("/caixa/historico?de=2026-10-01&ate=2026-10-31&pagina=3");
  });

  it("lê data e página com segurança", () => {
    expect(lerData("2026-10-01")).toBe("2026-10-01");
    expect(lerData("01/10/2026")).toBe("");
    expect(lerData(null)).toBe("");
    expect(lerPagina("4")).toBe(4);
    expect(lerPagina("0")).toBe(1);
    expect(lerPagina("-2")).toBe(1);
    expect(lerPagina("abc")).toBe(1);
    expect(lerPagina(null)).toBe(1);
  });
});

describe("HistoricoCaixasPage", () => {
  it("lista os caixas fechados com quem abriu, quem fechou, totais e link do extrato", async () => {
    vi.mocked(listHistoricoCaixas).mockResolvedValue(pagina([caixa(12), caixa(11, { abriu: "Carla", fechou: "Dino" })]));
    renderWithProviders(<HistoricoCaixasPage />);

    const linhas = (await screen.findAllByRole("row")).slice(1);
    expect(linhas).toHaveLength(2);
    expect(linhas[0]).toHaveTextContent("Ana");
    expect(linhas[0]).toHaveTextContent("Beto");
    expect(linhas[0]).toHaveTextContent("R$ 900,00");
    expect(linhas[0]).toHaveTextContent("R$ 200,00");
    expect(linhas[0]).toHaveTextContent("R$ 800,00");
    expect(within(linhas[0]).getByRole("link", { name: /Ver extrato/ })).toHaveAttribute("href", "/caixa/historico/12");
    expect(within(linhas[1]).getByRole("link", { name: /Ver extrato/ })).toHaveAttribute("href", "/caixa/historico/11");
    expect(screen.getByRole("link", { name: "Voltar ao caixa" })).toHaveAttribute("href", "/caixa");
    expect(listHistoricoCaixas).toHaveBeenCalledWith({ dataInicio: "", dataFim: "", pagina: 1, tamanhoPagina: 20 });
  });

  it("mostra a coluna de diferença só quando a API a devolve", async () => {
    vi.mocked(listHistoricoCaixas).mockResolvedValue(pagina([caixa(12, { totalDiferenca: -10 })]));
    renderWithProviders(<HistoricoCaixasPage />);

    expect(await screen.findByRole("columnheader", { name: "Diferença" })).toBeInTheDocument();
    expect(screen.getByText("Falta")).toBeInTheDocument();
  });

  it("sem diferença nos dados a coluna não aparece", async () => {
    vi.mocked(listHistoricoCaixas).mockResolvedValue(pagina([caixa(12)]));
    renderWithProviders(<HistoricoCaixasPage />);

    await screen.findAllByRole("row");
    expect(screen.queryByRole("columnheader", { name: "Diferença" })).not.toBeInTheDocument();
  });

  it("lê período e página da URL e pede esses dados à API", async () => {
    nav.query = "de=2026-10-01&ate=2026-10-31&pagina=2";
    vi.mocked(listHistoricoCaixas).mockResolvedValue(pagina([caixa(5)], { page: 2, totalPages: 3, totalRecords: 45 }));
    renderWithProviders(<HistoricoCaixasPage />);

    await screen.findAllByRole("row");
    expect(listHistoricoCaixas).toHaveBeenCalledWith({ dataInicio: "2026-10-01", dataFim: "2026-10-31", pagina: 2, tamanhoPagina: 20 });
    expect(screen.getByLabelText("De")).toHaveValue("2026-10-01");
    expect(screen.getByLabelText("Até")).toHaveValue("2026-10-31");
    expect(screen.getByText(/Mostrando 21–40 de 45/)).toBeInTheDocument();
  });

  it("filtrar escreve o período na URL e volta para a primeira página", async () => {
    vi.mocked(listHistoricoCaixas).mockResolvedValue(pagina([caixa(12)]));
    const user = userEvent.setup();
    renderWithProviders(<HistoricoCaixasPage />);
    await screen.findAllByRole("row");

    await user.type(screen.getByLabelText("De"), "2026-10-01");
    await user.type(screen.getByLabelText("Até"), "2026-10-31");
    await user.click(screen.getByRole("button", { name: "Filtrar" }));

    expect(nav.replace).toHaveBeenCalledWith("/caixa/historico?de=2026-10-01&ate=2026-10-31", { scroll: false });
  });

  it("data inicial depois da final mostra o erro e não mexe na URL nem chama a API de novo", async () => {
    vi.mocked(listHistoricoCaixas).mockResolvedValue(pagina([caixa(12)]));
    const user = userEvent.setup();
    renderWithProviders(<HistoricoCaixasPage />);
    await screen.findAllByRole("row");
    const chamadas = vi.mocked(listHistoricoCaixas).mock.calls.length;

    await user.type(screen.getByLabelText("De"), "2026-10-31");
    await user.type(screen.getByLabelText("Até"), "2026-10-01");
    await user.click(screen.getByRole("button", { name: "Filtrar" }));

    expect(screen.getByText("A data inicial não pode ser depois da final")).toBeInTheDocument();
    expect(nav.replace).not.toHaveBeenCalled();
    expect(vi.mocked(listHistoricoCaixas).mock.calls).toHaveLength(chamadas);
  });

  it("com período aplicado oferece limpar e volta à lista completa", async () => {
    nav.query = "de=2026-10-01";
    vi.mocked(listHistoricoCaixas).mockResolvedValue(pagina([caixa(12)]));
    const user = userEvent.setup();
    renderWithProviders(<HistoricoCaixasPage />);
    await screen.findAllByRole("row");

    await user.click(screen.getByRole("button", { name: "Limpar período" }));

    expect(nav.replace).toHaveBeenCalledWith("/caixa/historico", { scroll: false });
  });

  it("trocar de página mantém o período", async () => {
    nav.query = "de=2026-10-01";
    vi.mocked(listHistoricoCaixas).mockResolvedValue(pagina([caixa(12)], { totalPages: 3, totalRecords: 50 }));
    const user = userEvent.setup();
    renderWithProviders(<HistoricoCaixasPage />);
    await screen.findAllByRole("row");

    await user.click(screen.getByRole("button", { name: "Próxima" }));

    expect(nav.replace).toHaveBeenCalledWith("/caixa/historico?de=2026-10-01&pagina=2", { scroll: false });
  });

  it("vazio com e sem período tem mensagens próprias", async () => {
    vi.mocked(listHistoricoCaixas).mockResolvedValue(pagina([]));
    const { unmount } = renderWithProviders(<HistoricoCaixasPage />);
    expect(await screen.findByText("Ainda não há caixas fechados.")).toBeInTheDocument();
    unmount();

    nav.query = "de=2026-01-01";
    renderWithProviders(<HistoricoCaixasPage />);
    expect(await screen.findByText("Nenhum caixa fechado nesse período.")).toBeInTheDocument();
  });

  it("carregando mostra esqueleto com texto para leitor de tela", () => {
    vi.mocked(listHistoricoCaixas).mockReturnValue(new Promise(() => {}));
    renderWithProviders(<HistoricoCaixasPage />);

    expect(screen.getByRole("status")).toHaveTextContent("Carregando caixas anteriores");
  });

  it("erro mostra a mensagem da API e permite tentar de novo", async () => {
    vi.mocked(listHistoricoCaixas).mockRejectedValueOnce(new ApiError("server"));
    const user = userEvent.setup();
    renderWithProviders(<HistoricoCaixasPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Erro no servidor");

    vi.mocked(listHistoricoCaixas).mockResolvedValue(pagina([caixa(12)]));
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect((await screen.findAllByRole("row")).length).toBeGreaterThan(1);
  });

  it("403 mostra o aviso de permissão, sem nova tentativa", async () => {
    vi.mocked(listHistoricoCaixas).mockRejectedValue(new ApiError("forbidden"));
    renderWithProviders(<HistoricoCaixasPage />);

    expect(await screen.findByText("Você não tem permissão para acessar esta página.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Tentar novamente" })).not.toBeInTheDocument();
  });
});
