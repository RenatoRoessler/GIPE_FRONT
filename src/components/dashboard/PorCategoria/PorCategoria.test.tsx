import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { dashboardDto, dashboardMesFechadoDto } from "@/lib/api/services/dashboard.fixture";
import { fromDashboardResponse } from "@/lib/api/services/dashboard.mapper";
import { renderWithTheme } from "@/test/render";
import { PERIODO_DASHBOARD } from "@/types/dashboard";
import { PorCategoria } from "./PorCategoria";

describe("PorCategoria", () => {
  const outubro = fromDashboardResponse(dashboardMesFechadoDto());

  it("lista as categorias da com mais saídas para a com menos, com quantidade e valor", () => {
    renderWithTheme(<PorCategoria categorias={outubro.categorias} periodo={PERIODO_DASHBOARD.Mes} />);

    const linhas = screen.getAllByRole("listitem");
    expect(linhas.map((linha) => linha.firstElementChild?.textContent)).toEqual(["Carro médio", "Carro pequeno", "Moto"]);
    expect(within(linhas[0]).getByText("160")).toBeInTheDocument();
    expect(within(linhas[0]).getByText("R$ 3.100")).toBeInTheDocument();
    expect(within(linhas[2]).getByText("R$ 100")).toBeInTheDocument();
  });

  it("o trilho mede cada categoria pela que tem mais saídas", () => {
    const { container } = renderWithTheme(<PorCategoria categorias={outubro.categorias} periodo={PERIODO_DASHBOARD.Mes} />);

    const preenchimentos = Array.from(container.querySelectorAll("li [aria-hidden='true'] > span")) as HTMLElement[];
    expect(preenchimentos[0]).toHaveStyle({ width: "100%" });
    expect(preenchimentos[1]).toHaveStyle({ width: "81.25%" });
    expect(preenchimentos[2]).toHaveStyle({ width: "75%" });
  });

  it("o rodapé soma as saídas e o valor", () => {
    renderWithTheme(<PorCategoria categorias={outubro.categorias} periodo={PERIODO_DASHBOARD.Mes} />);

    expect(screen.getByText("410 saídas")).toBeInTheDocument();
    expect(screen.getByText("R$ 5.200 em estacionamento avulso")).toBeInTheDocument();
  });

  it("o título acompanha o período", () => {
    const { rerender } = renderWithTheme(<PorCategoria categorias={outubro.categorias} periodo={PERIODO_DASHBOARD.Dia} />);
    expect(screen.getByRole("region", { name: "Por categoria · saídas do dia" })).toBeInTheDocument();

    rerender(<PorCategoria categorias={outubro.categorias} periodo={PERIODO_DASHBOARD.Semana} />);
    expect(screen.getByRole("region", { name: "Por categoria · saídas da semana" })).toBeInTheDocument();

    rerender(<PorCategoria categorias={outubro.categorias} periodo={PERIODO_DASHBOARD.Mes} />);
    expect(screen.getByRole("region", { name: "Por categoria · saídas do mês" })).toBeInTheDocument();
  });

  it("resposta de exemplo (sem categorias): só a frase de vazio", () => {
    renderWithTheme(<PorCategoria categorias={fromDashboardResponse(dashboardDto).categorias} periodo={PERIODO_DASHBOARD.Dia} />);

    expect(screen.getByText("Aparece quando houver saídas no período.")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    expect(screen.queryByText(/em estacionamento avulso/)).not.toBeInTheDocument();
  });

  it("nome longo mostra o texto completo ao passar o mouse", () => {
    renderWithTheme(<PorCategoria categorias={[{ categoria: "Caminhonete cabine dupla", saidas: 3, valor: 90 }]} periodo={PERIODO_DASHBOARD.Dia} />);

    expect(screen.getByText("Caminhonete cabine dupla")).toHaveAttribute("title", "Caminhonete cabine dupla");
  });
});
