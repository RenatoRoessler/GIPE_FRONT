import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { dashboardDto, dashboardEmpresaNovaDto, dashboardMesFechadoDto, dashboardSemAlertasDto } from "@/lib/api/services/dashboard.fixture";
import { fromDashboardResponse } from "@/lib/api/services/dashboard.mapper";
import { renderWithProviders } from "@/test/render";
import type { Dashboard } from "@/types/dashboard";

const replace = vi.fn();
let parametros = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => parametros,
}));
const sessao = vi.hoisted(() => ({ perfil: 1 as number | null }));
vi.mock("@/contexts/CurrentUserContext", () => ({
  useCurrentUser: () => ({ user: { id: "u1", name: "Renato Roessler", perfil: sessao.perfil }, isLoading: false }),
}));
vi.mock("@/lib/api/services/dashboard", () => ({ getDashboard: vi.fn() }));

import { getDashboard } from "@/lib/api/services/dashboard";
import { DashboardPage } from "./DashboardPage";

const buscar = vi.mocked(getDashboard);
const exemplo = () => fromDashboardResponse(dashboardDto);
const outubro = () => fromDashboardResponse(dashboardMesFechadoDto());

function renderPagina() {
  return renderWithProviders(<DashboardPage />);
}

async function carregada() {
  await screen.findByRole("heading", { name: "Faturamento hoje" });
}

// Faz a tela parecer de celular (< md) ou larga, para a ordem dos blocos.
function telaComLargura(largura: number) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => {
      const maximo = Number(/max-width:\s*(\d+)px/.exec(query)?.[1] ?? Infinity);
      return { matches: largura <= maximo, media: query, addEventListener: vi.fn(), removeEventListener: vi.fn() };
    }),
  );
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 10, 19, 15, 45));
  replace.mockReset();
  parametros = new URLSearchParams();
  sessao.perfil = 1;
  buscar.mockReset().mockResolvedValue(exemplo());
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const regiao = (nome: string | RegExp) => screen.getByRole("region", { name: nome });

describe("DashboardPage: resposta de exemplo (19/11, início do uso em 07/11)", () => {
  it("consulta o dia de hoje sem data e mostra a saudação com a hora da atualização", async () => {
    renderPagina();
    await carregada();

    expect(buscar).toHaveBeenCalledWith({ periodo: 1, data: undefined });
    expect(screen.getByRole("heading", { level: 1, name: "Boa tarde, Renato" })).toBeInTheDocument();
    expect(screen.getByText("Quinta, 19 de novembro · atualizado às 15:45")).toBeInTheDocument();
    expect(screen.getByText("Hoje · 19 nov")).toBeInTheDocument();
  });

  it("faturamento de hoje R$ 0,00, queda de 100% vs. quinta passada e projeção do mês", async () => {
    renderPagina();
    await carregada();

    const faturamento = within(regiao("Faturamento hoje"));
    expect(faturamento.getByText("R$ 0,00")).toBeInTheDocument();
    expect(faturamento.getByText(/Queda de/)).toBeInTheDocument();
    expect(faturamento.getByText("100%")).toBeInTheDocument();
    expect(faturamento.getByText("vs. quinta passada")).toBeInTheDocument();
    expect(faturamento.getByText("Mês até agora")).toBeInTheDocument();
    expect(faturamento.getByText("R$ 1.404")).toBeInTheDocument();
    expect(faturamento.getByText("Projeção do mês")).toBeInTheDocument();
    expect(faturamento.getByText("R$ 2.591")).toBeInTheDocument();
  });

  it("sem comparação com o mês anterior: nada de variação do mês nem do fechamento anterior", async () => {
    renderPagina();
    await carregada();

    const faturamento = within(regiao("Faturamento hoje"));
    expect(faturamento.queryByText(/fechou/)).not.toBeInTheDocument();
    expect(faturamento.getAllByText(/vs\./)).toHaveLength(1);
  });

  it("ticket médio e permanência aparecem como travessão, nunca zero", async () => {
    renderPagina();
    await carregada();

    for (const nome of ["Saídas", "Ticket médio", "Permanência"]) {
      expect(within(regiao(nome)).getByText("—")).toBeInTheDocument();
    }
    expect(within(regiao("Ticket médio")).getByText("sem saídas pagas")).toBeInTheDocument();
  });

  it("pátio agora: 17 de 110 vagas, 15% ocupado, carros, motos, avulsos e mensalistas", async () => {
    renderPagina();
    await carregada();

    const patio = within(regiao("Pátio agora"));
    expect(patio.getByText("de 110 vagas")).toBeInTheDocument();
    expect(patio.getByText("15% ocupado")).toBeInTheDocument();
    expect(patio.getByText("Carros 17/70")).toBeInTheDocument();
    expect(patio.getByText("Motos 0/40")).toBeInTheDocument();
    expect(patio.getByText("17 avulsos")).toBeInTheDocument();
    expect(patio.getByText("0 mensalistas")).toBeInTheDocument();
  });

  it("pendências: só as três que existem, cada uma levando à sua tela", async () => {
    renderPagina();
    await carregada();

    const atencao = within(regiao("Precisa da sua atenção"));
    expect(atencao.getAllByRole("listitem")).toHaveLength(3);
    expect(atencao.getByRole("link", { name: /Mensalistas inadimplentes/ })).toHaveAttribute("href", "/mensalistas?aba=lista");
    expect(atencao.getByRole("link", { name: /Veículos há mais de 3 dias/ })).toHaveAttribute("href", "/patio/105");
    expect(atencao.getByRole("link", { name: /Faturas de conveniadas abertas/ })).toHaveAttribute("href", "/faturas");
  });

  it("gráfico diário: 17 dias tracejados antes do início do uso e os 13 dias com uso", async () => {
    const { container } = renderPagina();
    await carregada();

    expect(screen.getByRole("heading", { name: "Faturamento · 30 dias até hoje" })).toBeInTheDocument();
    expect(container.querySelectorAll("[data-lacuna]")).toHaveLength(17);
    expect(within(screen.getByRole("group", { name: "Faturamento por dia" })).getAllByRole("button")).toHaveLength(13);
  });

  it("origem sem mensalistas e recebimento com PIX, Dinheiro, Cartão de débito e Cartão de crédito", async () => {
    renderPagina();
    await carregada();

    const origem = within(regiao("De onde vem o dinheiro"));
    expect(origem.getByText("Avulso")).toBeInTheDocument();
    expect(origem.queryByText("Mensalistas")).not.toBeInTheDocument();

    const recebimento = within(regiao("Como você recebe"));
    expect(recebimento.getAllByRole("listitem").map((linha) => linha.firstElementChild?.textContent)).toEqual([
      "PIX",
      "Dinheiro",
      "Cartão de débito",
      "Cartão de crédito",
    ]);
  });

  it("categorias vazias mostram a frase, e o gráfico por hora vai de 0h a 15h com as demais horas em branco", async () => {
    const { container } = renderPagina();
    await carregada();

    expect(within(regiao("Por categoria · saídas do dia")).getByText("Aparece quando houver saídas no período.")).toBeInTheDocument();
    const porHora = regiao("Veículos no pátio por hora · hoje");
    expect(within(porHora).getAllByRole("button")).toHaveLength(16);
    expect(container.querySelectorAll("[data-futura]")).toHaveLength(8);
  });

  it("não usa nenhum valor nulo da API como zero", async () => {
    renderPagina();
    await carregada();

    expect(screen.queryByText("R$ 0")).not.toBeInTheDocument();
    expect(screen.queryByText("NaN")).not.toBeInTheDocument();
    expect(screen.queryByText(/undefined|NaN/)).not.toBeInTheDocument();
  });

  it("sem pendências mostra Tudo em dia", async () => {
    buscar.mockResolvedValue(fromDashboardResponse(dashboardSemAlertasDto()));
    renderPagina();
    await carregada();

    expect(within(regiao("Precisa da sua atenção")).getByText("Tudo em dia")).toBeInTheDocument();
  });
});

describe("DashboardPage: carregamento e erros", () => {
  it("mostra o esqueleto enquanto carrega, com o cabeçalho já utilizável", async () => {
    buscar.mockReturnValue(new Promise(() => {}));
    renderPagina();

    expect(screen.getByRole("status", { name: "Carregando a visão geral" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Boa tarde, Renato" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Semana" })).toBeEnabled();
  });

  it("erro: avisa, oferece Tentar de novo e carrega ao tentar", async () => {
    buscar.mockRejectedValueOnce(new ApiError("server", "Falha no servidor.", 500));
    const user = userEvent.setup();
    renderPagina();

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar a visão geral. Falha no servidor.");
    expect(screen.queryByRole("status", { name: "Carregando a visão geral" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Tentar de novo" }));

    await carregada();
    expect(buscar).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("sem permissão (403): só o aviso de permissão, sem tentar de novo", async () => {
    buscar.mockRejectedValue(new ApiError("forbidden", undefined, 403));
    renderPagina();

    expect(await screen.findByRole("alert")).toHaveTextContent("Você não tem permissão para acessar esta página.");
    expect(screen.queryByRole("button", { name: "Tentar de novo" })).not.toBeInTheDocument();
  });

  it("data recusada pelo servidor (400): volta ao período atual, sem mostrar erro", async () => {
    parametros = new URLSearchParams("data=2026-11-12");
    buscar.mockRejectedValue(new ApiError("validation", "Data inválida.", 400));
    renderPagina();

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard", { scroll: false }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("falha ao atualizar com dados na tela: mantém os dados e avisa", async () => {
    const user = userEvent.setup();
    const { queryClient } = renderPagina();
    await carregada();

    buscar.mockRejectedValueOnce(new ApiError("network"));
    await act(async () => {
      await queryClient.refetchQueries();
    });

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível atualizar a visão geral");
    expect(screen.getByRole("region", { name: "Faturamento hoje" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Tentar de novo" }));

    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
  });
});

describe("DashboardPage: período e navegação", () => {
  it("trocar o tipo de período grava o período na URL, sem data, e sem empilhar histórico", async () => {
    const user = userEvent.setup();
    renderPagina();
    await carregada();

    await user.click(screen.getByRole("tab", { name: "Semana" }));
    expect(replace).toHaveBeenLastCalledWith("/dashboard?periodo=semana", { scroll: false });

    await user.click(screen.getByRole("tab", { name: "Mês" }));
    expect(replace).toHaveBeenLastCalledWith("/dashboard?periodo=mes", { scroll: false });

    await user.click(screen.getByRole("tab", { name: "Dia" }));
    expect(replace).toHaveBeenLastCalledWith("/dashboard", { scroll: false });
  });

  it("‹ vai um dia para trás e › está desligada no período atual", async () => {
    const user = userEvent.setup();
    renderPagina();
    await carregada();

    expect(screen.getByRole("button", { name: "Próximo período" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Voltar para hoje" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Período anterior" }));

    expect(replace).toHaveBeenCalledWith("/dashboard?data=2026-11-18", { scroll: false });
  });

  it("consulta o período da URL com a data certa", async () => {
    parametros = new URLSearchParams("periodo=semana&data=2026-11-12");
    renderPagina();
    await carregada();

    expect(buscar).toHaveBeenCalledWith({ periodo: 2, data: "2026-11-12" });
    expect(screen.getByText("9 – 15 nov")).toBeInTheDocument();
  });

  it("fora do período atual: › volta a andar, Voltar para hoje aparece e leva ao período atual", async () => {
    parametros = new URLSearchParams("periodo=semana&data=2026-11-12");
    const user = userEvent.setup();
    renderPagina();
    await carregada();

    expect(screen.getByRole("button", { name: "Próximo período" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Próximo período" }));
    expect(replace).toHaveBeenLastCalledWith("/dashboard?periodo=semana", { scroll: false });

    await user.click(screen.getByRole("button", { name: "Voltar para hoje" }));
    expect(replace).toHaveBeenLastCalledWith("/dashboard?periodo=semana", { scroll: false });

    await user.click(screen.getByRole("button", { name: "Período anterior" }));
    expect(replace).toHaveBeenLastCalledWith("/dashboard?periodo=semana&data=2026-11-05", { scroll: false });
  });

  it("› de ontem volta ao dia de hoje, sem data na URL", async () => {
    parametros = new URLSearchParams("data=2026-11-18");
    const user = userEvent.setup();
    renderPagina();
    await carregada();

    await user.click(screen.getByRole("button", { name: "Próximo período" }));

    expect(replace).toHaveBeenLastCalledWith("/dashboard", { scroll: false });
    expect(screen.getByText("Ontem · 18 nov")).toBeInTheDocument();
  });

  it("‹ fica desligada no período que contém o início do uso (semana de 2 a 8 de novembro)", async () => {
    parametros = new URLSearchParams("periodo=semana&data=2026-11-05");
    renderPagina();
    await carregada();

    expect(screen.getByRole("button", { name: "Período anterior" })).toBeDisabled();
  });

  it("na troca de período mantém o conteúdo anterior, esmaecido e ocupado, até o novo chegar", async () => {
    const { container, rerender } = renderPagina();
    await carregada();

    let entregar: (dashboard: Dashboard) => void = () => {};
    buscar.mockReturnValueOnce(new Promise((resolver) => (entregar = resolver)));
    parametros = new URLSearchParams("periodo=mes&data=2026-10-01");
    rerender(<DashboardPage />);

    await waitFor(() => expect(container.querySelector("[aria-busy='true']")).not.toBeNull());
    expect(screen.getByRole("region", { name: "Faturamento hoje" })).toBeInTheDocument();
    expect(screen.queryByRole("status", { name: "Carregando a visão geral" })).not.toBeInTheDocument();

    await act(async () => entregar(outubro()));

    await waitFor(() => expect(container.querySelector("[aria-busy='true']")).toBeNull());
    expect(screen.getByRole("region", { name: /Outubro fechou em/ })).toBeInTheDocument();
  });
});

describe("DashboardPage: período fechado e empresa nova", () => {
  it("período fechado: sem Pátio agora nem pendências, com a marca Fechado e o gráfico do mês na linha inteira", async () => {
    parametros = new URLSearchParams("periodo=mes&data=2026-10-01");
    buscar.mockResolvedValue(outubro());
    renderPagina();
    await screen.findByRole("heading", { name: /Outubro fechou em/ });

    expect(screen.queryByRole("region", { name: "Pátio agora" })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Precisa da sua atenção" })).not.toBeInTheDocument();
    expect(screen.getByText("Fechado")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Faturamento por dia · outubro" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "De onde vem o dinheiro · outubro" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Como você recebe · outubro" })).toBeInTheDocument();
  });

  it("mês fechado: média por dia e melhor dia", async () => {
    parametros = new URLSearchParams("periodo=mes&data=2026-10-01");
    buscar.mockResolvedValue(outubro());
    renderPagina();
    await screen.findByRole("heading", { name: /Outubro fechou em/ });

    const faturamento = within(regiao(/Outubro fechou em/));
    expect(faturamento.getByText("Média por dia")).toBeInTheDocument();
    expect(faturamento.getByText("Melhor dia")).toBeInTheDocument();
    expect(faturamento.getByText("sáb, 17 out")).toBeInTheDocument();
  });

  it("mês em andamento com menos de 5 dias de uso: Disponível com 5 dias de uso", async () => {
    parametros = new URLSearchParams("periodo=mes");
    const dashboard = exemplo();
    buscar.mockResolvedValue({ ...dashboard, mes: { ...dashboard.mes, projecao: null, diasDeUso: 3 }, periodo: { ...dashboard.periodo, tipo: 3 } });
    renderPagina();
    await screen.findByRole("heading", { name: "Faturamento do mês" });

    expect(screen.getByText("Disponível com 5 dias de uso")).toBeInTheDocument();
    expect(screen.getByText("faltam 2 dias de uso")).toBeInTheDocument();
  });

  it("semana ou mês com menos de 7 dias de uso explica no lugar do gráfico por hora", async () => {
    parametros = new URLSearchParams("periodo=semana");
    const dashboard = exemplo();
    buscar.mockResolvedValue({ ...dashboard, movimentoPorHora: null, periodo: { ...dashboard.periodo, tipo: 2 } });
    renderPagina();
    await screen.findByRole("heading", { name: "Faturamento da semana" });

    expect(screen.getByText("As médias por hora aparecem depois de 7 dias de uso. No seletor Dia você já vê cada dia.")).toBeInTheDocument();
  });

  it("empresa nova: boas-vindas, setas desligadas e frases de vazio, sem zeros enganosos", async () => {
    buscar.mockResolvedValue(fromDashboardResponse(dashboardEmpresaNovaDto()));
    renderPagina();
    await screen.findByRole("heading", { name: "Seu faturamento aparece aqui" });

    expect(screen.getByRole("button", { name: "Período anterior" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Próximo período" })).toBeDisabled();
    expect(screen.getByText("O gráfico começa a aparecer a partir do primeiro dia com saídas registradas.")).toBeInTheDocument();
    expect(screen.getByText("Aparece quando houver faturamento no período.")).toBeInTheDocument();
    expect(screen.getByText("Aparece quando houver recebimentos no período.")).toBeInTheDocument();
    expect(screen.getByText("Aparece quando houver saídas no período.")).toBeInTheDocument();
    expect(screen.getByText("Aparece a partir do primeiro dia com veículos no pátio.")).toBeInTheDocument();
    expect(within(regiao("Precisa da sua atenção")).getByText("Tudo em dia")).toBeInTheDocument();
    expect(screen.queryByText("R$ 0,00")).not.toBeInTheDocument();
    expect(within(regiao("Saídas")).getByText("—")).toBeInTheDocument();
  });
});

describe("DashboardPage: ordem dos blocos", () => {
  const posicao = (a: HTMLElement, b: HTMLElement) => a.compareDocumentPosition(b);

  it("em tela larga o gráfico vem antes das pendências", async () => {
    telaComLargura(1400);
    renderPagina();
    await carregada();

    const grafico = screen.getByRole("heading", { name: /Faturamento · 30 dias/ });
    const atencao = screen.getByRole("heading", { name: "Precisa da sua atenção" });
    expect(posicao(grafico, atencao) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("no celular as pendências vêm antes do gráfico, e depois do pátio e dos indicadores", async () => {
    telaComLargura(375);
    renderPagina();
    await carregada();

    const heading = (nome: string | RegExp) => screen.getByRole("heading", { name: nome });
    const ordem = [
      heading("Faturamento hoje"),
      heading("Pátio agora"),
      heading("Saídas"),
      heading("Precisa da sua atenção"),
      heading(/Faturamento · 30 dias/),
      heading("De onde vem o dinheiro"),
      heading("Como você recebe"),
      heading(/Por categoria/),
      heading(/Veículos no pátio por hora/),
    ];
    for (let i = 0; i < ordem.length - 1; i += 1) {
      expect(posicao(ordem[i], ordem[i + 1]) & Node.DOCUMENT_POSITION_FOLLOWING, `bloco ${i}`).toBeTruthy();
    }
  });
});

describe("DashboardPage: perfis", () => {
  it("perfil sem acesso à Visão Geral: só o aviso de permissão, sem consultar a API", async () => {
    sessao.perfil = 8; // Financeiro
    renderPagina();

    expect(await screen.findByRole("alert")).toHaveTextContent("Você não tem permissão para acessar esta página.");
    expect(buscar).not.toHaveBeenCalled();
    expect(screen.queryByRole("status", { name: "Carregando a visão geral" })).not.toBeInTheDocument();
  });

  it("perfil desconhecido também não tem acesso", async () => {
    sessao.perfil = null;
    renderPagina();

    expect(await screen.findByRole("alert")).toHaveTextContent("Você não tem permissão");
    expect(buscar).not.toHaveBeenCalled();
  });
});
