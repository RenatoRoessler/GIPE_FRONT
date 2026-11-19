import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { dashboardDto, dashboardEmpresaNovaDto, dashboardMesFechadoDto } from "@/lib/api/services/dashboard.fixture";
import { fromDashboardResponse } from "@/lib/api/services/dashboard.mapper";
import { renderWithTheme } from "@/test/render";
import type { Dashboard } from "@/types/dashboard";
import { CardFaturamento } from "./CardFaturamento";

const hoje = new Date(2026, 10, 19, 15, 45);

function renderCard(dashboard: Dashboard) {
  return renderWithTheme(<CardFaturamento dashboard={dashboard} hoje={hoje} />);
}

describe("CardFaturamento", () => {
  it("resposta de exemplo: R$ 0,00 hoje, queda de 100% vs. quinta passada, mês até agora e projeção", () => {
    renderCard(fromDashboardResponse(dashboardDto));

    expect(screen.getByRole("heading", { name: "Faturamento hoje" })).toBeInTheDocument();
    expect(screen.getByText("R$ 0,00")).toBeInTheDocument();
    expect(screen.getByText(/Queda de/)).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.getByText("vs. quinta passada")).toBeInTheDocument();

    expect(screen.getByText("Mês até agora")).toBeInTheDocument();
    expect(screen.getByText("R$ 1.404")).toBeInTheDocument();
    expect(screen.getByText("desde 7 nov")).toBeInTheDocument();
    expect(screen.getByText("Projeção do mês")).toBeInTheDocument();
    expect(screen.getByText("R$ 2.591")).toBeInTheDocument();
    expect(screen.getByText("estimativa com base em 13 dias")).toBeInTheDocument();
  });

  it("período em andamento não tem a marca Fechado", () => {
    renderCard(fromDashboardResponse(dashboardDto));

    expect(screen.queryByText("Fechado")).not.toBeInTheDocument();
  });

  it("sem comparação a variação não aparece", () => {
    const dashboard = fromDashboardResponse(dashboardDto);
    renderCard({ ...dashboard, periodo: { ...dashboard.periodo, comparacao: null } });

    expect(screen.queryByText(/vs\./)).not.toBeInTheDocument();
    expect(screen.queryByText(/Queda de|Alta de/)).not.toBeInTheDocument();
    expect(screen.getByText("R$ 0,00")).toBeInTheDocument();
  });

  it("período comparado que não faturou não mostra variação", () => {
    const dashboard = fromDashboardResponse(dashboardDto);
    renderCard({ ...dashboard, periodo: { ...dashboard.periodo, comparacao: { ...dashboard.periodo.comparacao!, faturamento: 0, variacaoPercentual: null } } });

    expect(screen.queryByText(/vs\./)).not.toBeInTheDocument();
  });

  it("mês fechado: rótulo com o mês, marca Fechado, média por dia e melhor dia", () => {
    renderCard(fromDashboardResponse(dashboardMesFechadoDto()));

    expect(screen.getByRole("heading", { name: /Outubro fechou em/ })).toBeInTheDocument();
    expect(screen.getByText("Fechado")).toBeInTheDocument();
    expect(screen.getByText("R$ 9.120,50")).toBeInTheDocument();
    expect(screen.getByText("14%")).toBeInTheDocument();
    expect(screen.getByText("vs. setembro")).toBeInTheDocument();
    expect(screen.getByText("Média por dia")).toBeInTheDocument();
    expect(screen.getByText("31 dias com movimento")).toBeInTheDocument();
    expect(screen.getByText("Melhor dia")).toBeInTheDocument();
    expect(screen.getByText("R$ 810")).toBeInTheDocument();
    expect(screen.getByText("sáb, 17 out")).toBeInTheDocument();
  });

  it("projeção indisponível mostra a mensagem de espera e quantos dias faltam", () => {
    const dashboard = fromDashboardResponse(dashboardDto);
    renderCard({ ...dashboard, mes: { ...dashboard.mes, projecao: null, diasDeUso: 3 } });

    expect(screen.getByText("Disponível com 5 dias de uso")).toBeInTheDocument();
    expect(screen.getByText("faltam 2 dias de uso")).toBeInTheDocument();
  });

  it("empresa nova: boas-vindas em vez de números, sem zeros nem variação", () => {
    renderCard(fromDashboardResponse(dashboardEmpresaNovaDto()));

    expect(screen.getByRole("heading", { name: "Seu faturamento aparece aqui" })).toBeInTheDocument();
    expect(screen.getByText(/Assim que a primeira saída for registrada/)).toBeInTheDocument();
    expect(screen.queryByText("R$ 0,00")).not.toBeInTheDocument();
    expect(screen.queryByText(/Projeção do mês/)).not.toBeInTheDocument();
  });

  it("as duas colunas do mês são uma lista de definições legível por leitor de tela", () => {
    renderCard(fromDashboardResponse(dashboardDto));

    const projecao = screen.getByText("Projeção do mês").closest("div") as HTMLElement;
    expect(within(projecao).getByText("R$ 2.591")).toBeInTheDocument();
  });
});
