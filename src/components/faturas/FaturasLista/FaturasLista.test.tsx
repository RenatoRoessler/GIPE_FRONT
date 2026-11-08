import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import type { Paginado } from "@/lib/api/types";
import { renderWithProviders } from "@/test/render";
import { SITUACAO_FATURA, type Fatura, type FaturaFiltros } from "@/types/fatura";

const push = vi.fn();
const router = { push, replace: vi.fn() };
vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("@/lib/api/services/fatura", () => ({ listFaturas: vi.fn() }));

import { listFaturas } from "@/lib/api/services/fatura";
import { FaturasLista } from "./FaturasLista";

const listar = vi.mocked(listFaturas);

const aberta: Fatura = {
  convenioFaturaId: 12,
  empresaConveniadaId: 53,
  conveniada: "Auto Peças Sul",
  quantidadeSaidas: 14,
  valorTotal: 1250,
  vencimento: "2026-12-08",
  situacao: SITUACAO_FATURA.Aberta,
  observacao: null,
  usuario: "Renato",
  dataCriacao: "2026-11-08T10:46:56.797998",
  dataPagamento: null,
  formaPagamento: null,
  valorPago: null,
  usuarioPagamento: null,
  dataCancelamento: null,
  usuarioCancelamento: null,
};
const paga: Fatura = { ...aberta, convenioFaturaId: 11, conveniada: "Transp. Leste", quantidadeSaidas: 1, valorTotal: 312.5, situacao: SITUACAO_FATURA.Paga };
const cancelada: Fatura = { ...aberta, convenioFaturaId: 10, conveniada: "Norte", situacao: SITUACAO_FATURA.Cancelada };

const SEM_FILTROS: FaturaFiltros = { empresaConveniadaId: null, situacao: null, pagina: 1 };

function pagina(items: Fatura[], extra: Partial<Paginado<Fatura>> = {}): Paginado<Fatura> {
  return { items, page: 1, pageSize: 20, totalRecords: items.length, totalPages: 1, ...extra };
}

const onPaginaChange = vi.fn();
const onEmitir = vi.fn();
const onLimparFiltros = vi.fn();

function renderizar(filtros: FaturaFiltros = SEM_FILTROS) {
  return renderWithProviders(<FaturasLista filtros={filtros} onPaginaChange={onPaginaChange} onEmitir={onEmitir} onLimparFiltros={onLimparFiltros} />);
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("FaturasLista", () => {
  it("enquanto carrega mostra o estado de carregamento", () => {
    listar.mockReturnValue(new Promise(() => undefined));
    renderizar();

    expect(screen.getByRole("status", { name: "Carregando faturas" })).toBeInTheDocument();
  });

  it("lista as faturas com número, conveniada, datas, quantidade, valor e situação em texto", async () => {
    listar.mockResolvedValue(pagina([aberta, paga, cancelada]));
    renderizar();

    const linhas = await screen.findAllByRole("row");
    // O primeiro é o cabeçalho.
    expect(linhas).toHaveLength(4);
    const primeira = within(linhas[1]);
    expect(primeira.getByRole("link", { name: "Fatura #12" })).toHaveAttribute("href", "/faturas/12");
    expect(primeira.getByText("Auto Peças Sul")).toBeInTheDocument();
    expect(primeira.getByText("08/11/2026")).toBeInTheDocument();
    expect(primeira.getByText("08/12/2026")).toBeInTheDocument();
    expect(primeira.getByText("14")).toBeInTheDocument();
    expect(primeira.getByText("R$ 1.250,00")).toBeInTheDocument();
    expect(primeira.getByText("Aberta")).toBeInTheDocument();
    expect(within(linhas[2]).getByText("Paga")).toBeInTheDocument();
    expect(within(linhas[3]).getByText("Cancelada")).toBeInTheDocument();
  });

  it("consulta com os filtros recebidos", async () => {
    listar.mockResolvedValue(pagina([aberta]));
    renderizar({ empresaConveniadaId: 53, situacao: SITUACAO_FATURA.Aberta, pagina: 2 });

    await screen.findByText("Auto Peças Sul");
    expect(listar).toHaveBeenCalledWith({ empresaConveniadaId: 53, situacao: SITUACAO_FATURA.Aberta, pagina: 2 });
  });

  it("clicar na linha leva ao detalhe, mas clicar no link não navega duas vezes", async () => {
    listar.mockResolvedValue(pagina([aberta]));
    const user = userEvent.setup();
    renderizar();

    await user.click(await screen.findByText("Auto Peças Sul"));
    expect(push).toHaveBeenCalledWith("/faturas/12");

    push.mockClear();
    await user.click(screen.getByRole("link", { name: "Fatura #12" }));
    expect(push).not.toHaveBeenCalled();
  });

  it("pagina: mostra o total e pede a próxima página", async () => {
    listar.mockResolvedValue(pagina([aberta], { page: 1, totalPages: 3, totalRecords: 45 }));
    const user = userEvent.setup();
    renderizar();

    expect(await screen.findByText("Mostrando 1–20 de 45")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Próxima" }));
    expect(onPaginaChange).toHaveBeenCalledWith(2);
  });

  it("vazio sem filtro convida a emitir a primeira fatura", async () => {
    listar.mockResolvedValue(pagina([]));
    const user = userEvent.setup();
    renderizar();

    expect(await screen.findByText("Nenhuma fatura emitida ainda.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Emitir fatura" }));
    expect(onEmitir).toHaveBeenCalledTimes(1);
  });

  it("vazio com filtro oferece limpar os filtros", async () => {
    listar.mockResolvedValue(pagina([]));
    const user = userEvent.setup();
    renderizar({ empresaConveniadaId: null, situacao: SITUACAO_FATURA.Paga, pagina: 1 });

    expect(await screen.findByText("Nenhuma fatura encontrada com esses filtros.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Limpar filtros" }));
    expect(onLimparFiltros).toHaveBeenCalledTimes(1);
  });

  it("erro mostra a mensagem e permite tentar de novo", async () => {
    listar.mockRejectedValueOnce(new ApiError("server", "Falha no servidor.")).mockResolvedValue(pagina([aberta]));
    const user = userEvent.setup();
    renderizar();

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar as faturas. Falha no servidor.");
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
    await waitFor(() => expect(screen.getByText("Auto Peças Sul")).toBeInTheDocument());
  });

  it("403 mostra o aviso de permissão, sem tentar de novo", async () => {
    listar.mockRejectedValue(new ApiError("forbidden"));
    renderizar();

    await waitFor(() => expect(screen.queryByRole("status", { name: "Carregando faturas" })).not.toBeInTheDocument());
    expect(screen.queryByRole("button", { name: "Tentar novamente" })).not.toBeInTheDocument();
    expect(screen.getByText(/permiss/i)).toBeInTheDocument();
  });
});

describe("FaturasLista no celular", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn((query: string) => ({ matches: true, media: query, addEventListener: () => {}, removeEventListener: () => {} })),
    );
    window.scrollTo = vi.fn();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("enquanto carrega mostra o estado de carregamento em cartões", () => {
    listar.mockReturnValue(new Promise(() => undefined));
    renderizar();

    expect(screen.getByRole("status", { name: "Carregando faturas" })).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("troca a tabela por cartões, com os dados e o link de cada fatura", async () => {
    listar.mockResolvedValue(pagina([aberta, paga, cancelada]));
    renderizar();

    const itens = await screen.findAllByRole("listitem");
    expect(itens).toHaveLength(3);
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(within(itens[0]).getByText("Auto Peças Sul")).toBeInTheDocument();
    expect(within(itens[0]).getByText("R$ 1.250,00")).toBeInTheDocument();
    expect(within(itens[0]).getByText("Aberta")).toBeInTheDocument();
    expect(within(itens[0]).getByRole("link", { name: /Fatura 12, Auto Peças Sul/ })).toHaveAttribute("href", "/faturas/12");
    expect(within(itens[1]).getByText("Paga")).toBeInTheDocument();
    expect(within(itens[2]).getByText("Cancelada")).toBeInTheDocument();
  });

  it("pagina e volta ao topo ao trocar de página", async () => {
    listar.mockResolvedValue(pagina([aberta], { page: 1, totalPages: 3, totalRecords: 45 }));
    const user = userEvent.setup();
    renderizar();

    await screen.findByText("Auto Peças Sul");
    await user.click(screen.getByRole("button", { name: "Próxima" }));
    expect(onPaginaChange).toHaveBeenCalledWith(2);
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0 });
  });

  it("mantém os estados vazios, com e sem filtro", async () => {
    listar.mockResolvedValue(pagina([]));
    const { unmount } = renderizar();
    expect(await screen.findByText("Nenhuma fatura emitida ainda.")).toBeInTheDocument();
    unmount();

    renderizar({ ...SEM_FILTROS, situacao: SITUACAO_FATURA.Paga });
    expect(await screen.findByText("Nenhuma fatura encontrada com esses filtros.")).toBeInTheDocument();
  });

  it("mantém o erro com a opção de tentar de novo", async () => {
    listar.mockRejectedValue(new ApiError("server", "Falha no servidor."));
    renderizar();

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar as faturas. Falha no servidor.");
    expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeInTheDocument();
  });
});
