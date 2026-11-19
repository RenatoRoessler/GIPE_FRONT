import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { dashboardDto } from "@/lib/api/services/dashboard.fixture";
import { fromDashboardResponse } from "@/lib/api/services/dashboard.mapper";
import { lightTheme } from "@/styles/theme";
import { renderWithTheme } from "@/test/render";
import type { DashboardPatio } from "@/types/dashboard";
import { CardPatioAgora } from "./CardPatioAgora";

const patioDoExemplo = (): DashboardPatio => fromDashboardResponse(dashboardDto).patio!;

describe("CardPatioAgora", () => {
  it("resposta de exemplo: 17 de 110 vagas, 15% ocupado, carros, motos, avulsos e mensalistas", () => {
    renderWithTheme(<CardPatioAgora patio={patioDoExemplo()} />);

    expect(screen.getByRole("region", { name: "Pátio agora" })).toBeInTheDocument();
    expect(screen.getByText("17")).toBeInTheDocument();
    expect(screen.getByText("de 110 vagas")).toBeInTheDocument();
    expect(screen.getByText("15% ocupado")).toBeInTheDocument();
    expect(screen.getByText("Carros 17/70")).toBeInTheDocument();
    expect(screen.getByText("Motos 0/40")).toBeInTheDocument();
    expect(screen.getByText("17 avulsos")).toBeInTheDocument();
    expect(screen.getByText("0 mensalistas")).toBeInTheDocument();
  });

  it("a barra mede a ocupação, no amarelo da marca", () => {
    renderWithTheme(<CardPatioAgora patio={patioDoExemplo()} />);

    const barra = screen.getByRole("progressbar", { name: "Ocupação do pátio" });
    expect(barra).toHaveAttribute("aria-valuenow", "17");
    expect(barra).toHaveAttribute("aria-valuemax", "110");
    expect(barra.firstChild).toHaveStyle({ backgroundColor: lightTheme.colors.primary });
  });

  it("fala no singular com um avulso e um mensalista", () => {
    renderWithTheme(<CardPatioAgora patio={{ ...patioDoExemplo(), avulsos: 1, mensalistas: 1 }} />);

    expect(screen.getByText("1 avulso")).toBeInTheDocument();
    expect(screen.getByText("1 mensalista")).toBeInTheDocument();
  });

  it("pátio lotado e vazio", () => {
    const { rerender } = renderWithTheme(<CardPatioAgora patio={{ ...patioDoExemplo(), ocupados: 110 }} />);
    expect(screen.getByText("100% ocupado")).toBeInTheDocument();

    rerender(<CardPatioAgora patio={{ ...patioDoExemplo(), ocupados: 0, avulsos: 0 }} />);
    expect(screen.getByText("0% ocupado")).toBeInTheDocument();
    expect(screen.getByText("0 avulsos")).toBeInTheDocument();
  });

  it("sem capacidade cadastrada não calcula percentual nem mostra a barra", () => {
    const patio: DashboardPatio = {
      ocupados: 4,
      capacidade: 0,
      carros: { ocupados: 4, capacidade: 0 },
      motos: { ocupados: 0, capacidade: 0 },
      avulsos: 4,
      mensalistas: 0,
    };
    renderWithTheme(<CardPatioAgora patio={patio} />);

    expect(screen.getByText("veículos no pátio")).toBeInTheDocument();
    expect(screen.queryByText(/ocupado$/)).not.toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.getByText("Carros 4/0")).toBeInTheDocument();
    expect(screen.queryByText(/Motos/)).not.toBeInTheDocument();
  });
});
