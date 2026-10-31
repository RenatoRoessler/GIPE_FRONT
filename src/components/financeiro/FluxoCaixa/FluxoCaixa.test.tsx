import { fireEvent, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { renderWithProviders } from "@/test/render";
import type { FluxoCaixa as FluxoCaixaDados, FluxoCategoria } from "@/types/financeiro";

const replace = vi.fn();
let consulta = "";
let mobile = false;

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => new URLSearchParams(consulta),
}));

vi.mock("@/hooks/useMediaQuery", () => ({ useIsMobile: () => mobile, useMediaQuery: () => false }));

vi.mock("@/lib/api/services/financeiro", () => ({ getFluxo: vi.fn() }));

import { getFluxo } from "@/lib/api/services/financeiro";
import { FluxoCaixa } from "./FluxoCaixa";

function categoria(extra: Partial<FluxoCategoria>): FluxoCategoria {
  return { origem: 3, tipo: 2, financeiroCategoriaId: null, categoria: "", financeiroCategoriaPaiId: null, categoriaPai: null, valor: 0, ...extra };
}

const fluxo: FluxoCaixaDados = {
  dataInicio: "2026-10-01",
  dataFim: "2026-10-31",
  agrupamento: 1,
  totalEntradas: 75110,
  totalSaidas: 2450,
  saldo: 72660,
  categorias: [
    categoria({ origem: 1, tipo: 1, categoria: "Estacionamento rotativo", valor: 74810 }),
    categoria({ origem: 2, tipo: 1, categoria: "Mensalidades", valor: 300 }),
    categoria({ financeiroCategoriaId: 2, categoria: "Aluguel", financeiroCategoriaPaiId: 1, categoriaPai: "Despesas fixas", valor: 2000 }),
    categoria({ financeiroCategoriaId: 3, categoria: "Energia", financeiroCategoriaPaiId: 1, categoriaPai: "Despesas fixas", valor: 450 }),
  ],
  periodos: [{ data: "2026-10-01", entradas: 75110, saidas: 2450, saldo: 72660, saldoAcumulado: 72660 }],
};

const handlers = { onLancarDespesa: vi.fn() };

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 9, 30, 12));
  replace.mockReset();
  consulta = "";
  mobile = false;
  vi.mocked(getFluxo).mockReset();
  handlers.onLancarDespesa.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("FluxoCaixa: período", () => {
  it("abre no mês corrente inteiro, agrupado por dia", async () => {
    vi.mocked(getFluxo).mockResolvedValue(fluxo);
    renderWithProviders(<FluxoCaixa {...handlers} />);

    await screen.findByText("Saldo do período");
    expect(getFluxo).toHaveBeenCalledWith({ dataInicio: "2026-10-01", dataFim: "2026-10-31", agrupamento: 1 });
    expect(screen.getByRole("button", { name: "Este mês" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("radio", { name: "Dia" })).toBeChecked();
    expect(screen.getByLabelText("De")).toHaveValue("2026-10-01");
    expect(screen.getByLabelText("Até")).toHaveValue("2026-10-31");
  });

  it("lê o período e o agrupamento do endereço", async () => {
    consulta = "de=2026-01-01&ate=2026-12-31&ver=mes";
    vi.mocked(getFluxo).mockResolvedValue({ ...fluxo, agrupamento: 2 });
    renderWithProviders(<FluxoCaixa {...handlers} />);

    await screen.findByText("Saldo do período");
    expect(getFluxo).toHaveBeenCalledWith({ dataInicio: "2026-01-01", dataFim: "2026-12-31", agrupamento: 2 });
    expect(screen.getByRole("button", { name: "Este ano" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("radio", { name: "Mês" })).toBeChecked();
  });

  it("escolher um atalho aplica na hora, indo para o endereço", async () => {
    vi.mocked(getFluxo).mockResolvedValue(fluxo);
    renderWithProviders(<FluxoCaixa {...handlers} />);
    await screen.findByText("Saldo do período");

    fireEvent.click(screen.getByRole("button", { name: "Mês anterior" }));

    expect(replace).toHaveBeenLastCalledWith("/financeiro?de=2026-09-01&ate=2026-09-30", { scroll: false });
  });

  it("voltar ao mês corrente deixa o endereço limpo", async () => {
    consulta = "de=2026-09-01&ate=2026-09-30";
    vi.mocked(getFluxo).mockResolvedValue(fluxo);
    renderWithProviders(<FluxoCaixa {...handlers} />);
    await screen.findByText("Saldo do período");

    fireEvent.click(screen.getByRole("button", { name: "Este mês" }));

    expect(replace).toHaveBeenLastCalledWith("/financeiro", { scroll: false });
  });

  it("ver por mês vai para o endereço e mantém o período", async () => {
    vi.mocked(getFluxo).mockResolvedValue(fluxo);
    renderWithProviders(<FluxoCaixa {...handlers} />);
    await screen.findByText("Saldo do período");

    fireEvent.click(screen.getByRole("radio", { name: "Mês" }));

    expect(replace).toHaveBeenLastCalledWith("/financeiro?ver=mes", { scroll: false });
  });

  it("período personalizado vale depois de Aplicar", async () => {
    vi.mocked(getFluxo).mockResolvedValue(fluxo);
    renderWithProviders(<FluxoCaixa {...handlers} />);
    await screen.findByText("Saldo do período");

    fireEvent.change(screen.getByLabelText("De"), { target: { value: "2026-10-10" } });
    fireEvent.change(screen.getByLabelText("Até"), { target: { value: "2026-10-20" } });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar" }));

    expect(replace).toHaveBeenLastCalledWith("/financeiro?de=2026-10-10&ate=2026-10-20", { scroll: false });
  });

  it("período acima de 366 dias mostra o erro no campo e não muda o endereço", async () => {
    vi.mocked(getFluxo).mockResolvedValue(fluxo);
    renderWithProviders(<FluxoCaixa {...handlers} />);
    await screen.findByText("Saldo do período");

    fireEvent.change(screen.getByLabelText("De"), { target: { value: "2026-01-10" } });
    fireEvent.change(screen.getByLabelText("Até"), { target: { value: "2027-01-11" } });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar" }));

    expect(screen.getByText("Escolha um período de até 366 dias")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("datas obrigatórias: campo vazio mostra o erro e não aplica", async () => {
    vi.mocked(getFluxo).mockResolvedValue(fluxo);
    renderWithProviders(<FluxoCaixa {...handlers} />);
    await screen.findByText("Saldo do período");

    fireEvent.change(screen.getByLabelText("De"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar" }));

    expect(screen.getByText("Informe a data inicial")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("endereço com período inválido avisa e não consulta o back", () => {
    consulta = "de=2026-10-31&ate=2026-10-01";
    renderWithProviders(<FluxoCaixa {...handlers} />);

    expect(screen.getByRole("alert")).toHaveTextContent("A data final deve ser igual ou posterior à inicial");
    expect(getFluxo).not.toHaveBeenCalled();
  });

  it("no celular, as datas ficam num bloco recolhido e os atalhos aparecem", async () => {
    mobile = true;
    vi.mocked(getFluxo).mockResolvedValue(fluxo);
    renderWithProviders(<FluxoCaixa {...handlers} />);
    await screen.findByText("Saldo do período");

    expect(screen.getByRole("button", { name: "Personalizar período" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("button", { name: "Este mês" })).toBeInTheDocument();
  });
});

describe("FluxoCaixa: saldo e composição", () => {
  it("mostra o saldo em destaque, com entradas, saídas e o período por extenso", async () => {
    vi.mocked(getFluxo).mockResolvedValue(fluxo);
    renderWithProviders(<FluxoCaixa {...handlers} />);

    const cartao = await screen.findByRole("region", { name: "Saldo do período" });
    expect(within(cartao).getByText(/^R\$\s*72\.660,00$/)).toBeInTheDocument();
    expect(within(cartao).getByText(/R\$\s*75\.110,00/)).toBeInTheDocument();
    expect(within(cartao).getByText(/R\$\s*2\.450,00/)).toBeInTheDocument();
    expect(within(cartao).getByText("01/10 a 31/10/2026")).toBeInTheDocument();
  });

  it("saldo negativo leva o sinal − escrito e o aviso para leitores de tela", async () => {
    vi.mocked(getFluxo).mockResolvedValue({ ...fluxo, saldo: -1250, totalEntradas: 0, totalSaidas: 1250 });
    renderWithProviders(<FluxoCaixa {...handlers} />);

    const valor = await screen.findByText(/^−\s*R\$\s*1\.250,00$/);
    expect(valor).toHaveAttribute("aria-label", expect.stringMatching(/^Negativo, R\$\s*1\.250,00$/));
  });

  it("agrupa os lançamentos pela categoria pai, com as filhas, e mostra as fatias", async () => {
    vi.mocked(getFluxo).mockResolvedValue(fluxo);
    renderWithProviders(<FluxoCaixa {...handlers} />);

    const entradas = await screen.findByRole("region", { name: "Entradas" });
    expect(within(entradas).getByText("Estacionamento rotativo")).toBeInTheDocument();
    expect(within(entradas).getByText("99,6%")).toBeInTheDocument();
    expect(within(entradas).getByText("Mensalidades")).toBeInTheDocument();

    const saidas = screen.getByRole("region", { name: "Saídas" });
    expect(within(saidas).getByText("Despesas fixas")).toBeInTheDocument();
    expect(within(saidas).getByText("Aluguel")).toBeInTheDocument();
    expect(within(saidas).getByText("Energia")).toBeInTheDocument();
    expect(within(saidas).getAllByText(/R\$\s*2\.450,00/)).not.toHaveLength(0);
  });

  it("a categoria leva aos lançamentos dela, no mesmo período; rotativo e mensalidades não são links", async () => {
    vi.mocked(getFluxo).mockResolvedValue(fluxo);
    renderWithProviders(<FluxoCaixa {...handlers} />);

    const saidas = await screen.findByRole("region", { name: "Saídas" });
    expect(within(saidas).getByRole("link", { name: "Despesas fixas" })).toHaveAttribute(
      "href",
      "/financeiro?aba=lancamentos&lde=2026-10-01&late=2026-10-31&categoria=1",
    );
    expect(within(saidas).getByRole("link", { name: "Aluguel" })).toHaveAttribute("href", expect.stringContaining("categoria=2"));
    expect(screen.queryByRole("link", { name: "Estacionamento rotativo" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Mensalidades" })).not.toBeInTheDocument();
  });

  it("sem saídas no período, avisa e oferece lançar uma despesa", async () => {
    vi.mocked(getFluxo).mockResolvedValue({ ...fluxo, totalSaidas: 0, saldo: 75110, categorias: fluxo.categorias.slice(0, 2) });
    renderWithProviders(<FluxoCaixa {...handlers} />);

    expect(await screen.findByText("Nenhuma saída no período.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Lançar despesa" }));
    expect(handlers.onLancarDespesa).toHaveBeenCalled();
  });

  it("período sem movimento mostra zero e os dois lados vazios", async () => {
    vi.mocked(getFluxo).mockResolvedValue({ ...fluxo, totalEntradas: 0, totalSaidas: 0, saldo: 0, categorias: [], periodos: [] });
    renderWithProviders(<FluxoCaixa {...handlers} />);

    const cartao = await screen.findByRole("region", { name: "Saldo do período" });
    // O saldo, as entradas e as saídas: três zeros no cartão.
    expect(within(cartao).getAllByText(/^R\$\s*0,00$/)).toHaveLength(3);
    expect(screen.getByText("Nenhuma entrada no período.")).toBeInTheDocument();
    expect(screen.getByText("Nenhuma saída no período.")).toBeInTheDocument();
  });

  it("explica que sangria e suprimento não entram no fluxo", async () => {
    vi.mocked(getFluxo).mockResolvedValue(fluxo);
    renderWithProviders(<FluxoCaixa {...handlers} />);

    expect(await screen.findByText(/Sangria e suprimento não entram no fluxo/)).toBeInTheDocument();
  });
});

describe("FluxoCaixa: estados", () => {
  it("mostra o carregamento enquanto busca", () => {
    vi.mocked(getFluxo).mockReturnValue(new Promise(() => {}));
    renderWithProviders(<FluxoCaixa {...handlers} />);

    expect(screen.getByRole("status", { name: "Carregando fluxo de caixa" })).toBeInTheDocument();
  });

  it("erro mostra a mensagem do back e deixa tentar de novo", async () => {
    vi.mocked(getFluxo).mockRejectedValueOnce(new ApiError("validation", "O período do fluxo de caixa pode ter no máximo 366 dias.", 400)).mockResolvedValueOnce(fluxo);
    renderWithProviders(<FluxoCaixa {...handlers} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar o fluxo de caixa. O período do fluxo de caixa pode ter no máximo 366 dias.");
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByText("Saldo do período")).toBeInTheDocument();
  });

  it("403 mostra o aviso de permissão, sem tentar de novo", async () => {
    vi.mocked(getFluxo).mockRejectedValue(new ApiError("forbidden", undefined, 403));
    renderWithProviders(<FluxoCaixa {...handlers} />);

    expect(await screen.findByText(/permiss/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Tentar novamente" })).not.toBeInTheDocument();
  });
});
