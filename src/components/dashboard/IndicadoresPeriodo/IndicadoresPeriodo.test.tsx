import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { dashboardDto, dashboardMesFechadoDto } from "@/lib/api/services/dashboard.fixture";
import { fromDashboardResponse } from "@/lib/api/services/dashboard.mapper";
import { renderWithTheme } from "@/test/render";
import { IndicadoresPeriodo } from "./IndicadoresPeriodo";

function painel(nome: string) {
  return within(screen.getByRole("region", { name: nome }));
}

describe("IndicadoresPeriodo", () => {
  it("com saídas mostra a quantidade, o ticket médio e a permanência", () => {
    renderWithTheme(<IndicadoresPeriodo periodo={fromDashboardResponse(dashboardMesFechadoDto()).periodo} />);

    expect(painel("Saídas").getByText("410")).toBeInTheDocument();
    expect(painel("Saídas").getByText("veículos atendidos")).toBeInTheDocument();
    expect(painel("Ticket médio").getByText("R$ 17,40")).toBeInTheDocument();
    expect(painel("Ticket médio").getByText("por saída paga")).toBeInTheDocument();
    expect(painel("Permanência").getByText("1h 52min")).toBeInTheDocument();
    expect(painel("Permanência").getByText("média das saídas")).toBeInTheDocument();
  });

  it("resposta de exemplo (sem saídas): travessão e a frase do porquê, nunca zero", () => {
    renderWithTheme(<IndicadoresPeriodo periodo={fromDashboardResponse(dashboardDto).periodo} />);

    expect(painel("Saídas").getByText("—")).toBeInTheDocument();
    expect(painel("Saídas").getByText("sem saídas no período")).toBeInTheDocument();
    expect(painel("Ticket médio").getByText("—")).toBeInTheDocument();
    expect(painel("Ticket médio").getByText("sem saídas pagas")).toBeInTheDocument();
    expect(painel("Permanência").getByText("—")).toBeInTheDocument();
    expect(painel("Permanência").getByText("sem saídas no período")).toBeInTheDocument();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
    expect(screen.queryByText("R$ 0,00")).not.toBeInTheDocument();
  });

  it("cada indicador se decide sozinho: pode haver saídas e nenhuma paga", () => {
    const { periodo } = fromDashboardResponse(dashboardDto);
    renderWithTheme(<IndicadoresPeriodo periodo={{ ...periodo, saidas: 3, ticketMedio: null, permanenciaMediaMinutos: 45 }} />);

    expect(painel("Saídas").getByText("3")).toBeInTheDocument();
    expect(painel("Ticket médio").getByText("—")).toBeInTheDocument();
    expect(painel("Permanência").getByText("45min")).toBeInTheDocument();
  });

  it("formata a quantidade de saídas com separador de milhar", () => {
    const { periodo } = fromDashboardResponse(dashboardDto);
    renderWithTheme(<IndicadoresPeriodo periodo={{ ...periodo, saidas: 1234 }} />);

    expect(painel("Saídas").getByText("1.234")).toBeInTheDocument();
  });
});
