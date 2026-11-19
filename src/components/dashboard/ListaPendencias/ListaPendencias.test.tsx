import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { dashboardDto } from "@/lib/api/services/dashboard.fixture";
import { fromDashboardResponse } from "@/lib/api/services/dashboard.mapper";
import { lightTheme } from "@/styles/theme";
import { renderWithTheme } from "@/test/render";
import type { DashboardAlertas } from "@/types/dashboard";
import { pendencias } from "../apresentacao";
import { ListaPendencias } from "./ListaPendencias";

const todasAsAreas = () => true;

const completos: DashboardAlertas = {
  mensalistasInadimplentes: { quantidade: 4, valor: 1120 },
  mensalidadesAVencer: { quantidade: 7, valor: 2310 },
  faturasConveniadaAbertas: { quantidade: 2, valor: 860 },
  caixasComDiferenca: { quantidade: 1, valor: -35 },
  veiculosParados: { quantidade: 15, horasMinimas: 72, maisAntigo: { idPatio: 105, placa: "LMA8376", permanenciaMinutos: 15862 } },
};

function renderLista(alertas: DashboardAlertas | null, podeAcessar: (area: string) => boolean = todasAsAreas) {
  return renderWithTheme(<ListaPendencias itens={pendencias(alertas, podeAcessar)} />);
}

describe("ListaPendencias", () => {
  it("resposta de exemplo: as três pendências que existem, cada uma com título, resumo e contagem", () => {
    renderLista(fromDashboardResponse(dashboardDto).alertas);

    const painel = within(screen.getByRole("region", { name: "Precisa da sua atenção" }));
    expect(painel.getAllByRole("listitem")).toHaveLength(3);
    expect(painel.getByText("Mensalistas inadimplentes")).toBeInTheDocument();
    expect(painel.getByText("R$ 250 em atraso")).toBeInTheDocument();
    expect(painel.getByText("Veículos há mais de 3 dias")).toBeInTheDocument();
    expect(painel.getByText("Mais antigo: LMA8376 · 11d 0h")).toBeInTheDocument();
    expect(painel.getByText("Faturas de conveniadas abertas")).toBeInTheDocument();
    expect(painel.getByText("R$ 1,50 a receber")).toBeInTheDocument();
  });

  it("cada pendência é um link para a tela em que se resolve", () => {
    renderLista(fromDashboardResponse(dashboardDto).alertas);

    expect(screen.getByRole("link", { name: /Mensalistas inadimplentes/ })).toHaveAttribute("href", "/mensalistas?aba=lista");
    expect(screen.getByRole("link", { name: /Veículos há mais de 3 dias/ })).toHaveAttribute("href", "/patio/105");
    expect(screen.getByRole("link", { name: /Faturas de conveniadas abertas/ })).toHaveAttribute("href", "/faturas");
  });

  it("a contagem é lida com a palavra Quantidade", () => {
    renderLista(fromDashboardResponse(dashboardDto).alertas);

    expect(screen.getByRole("link", { name: /Veículos há mais de 3 dias.*Quantidade: 15/ })).toBeInTheDocument();
  });

  it("as cinco pendências aparecem na ordem de severidade", () => {
    renderLista(completos);

    const titulos = screen.getAllByRole("listitem").map((item) => item.querySelector("span span")?.textContent);
    expect(titulos).toEqual([
      "Mensalistas inadimplentes",
      "Caixa fechado com diferença",
      "Veículos há mais de 3 dias",
      "Mensalidades vencem em 5 dias",
      "Faturas de conveniadas abertas",
    ]);
    expect(screen.getByText("1 turno nos últimos 7 dias · Falta R$ 35,00")).toBeInTheDocument();
    expect(screen.getByText("R$ 2.310 a receber")).toBeInTheDocument();
  });

  it("a contagem usa a cor da severidade", () => {
    renderLista(completos);
    const contagem = (titulo: RegExp) => screen.getByRole("link", { name: titulo }).querySelector("span:nth-of-type(3)");

    expect(contagem(/Mensalistas inadimplentes/)).toHaveStyle({ color: lightTheme.colors.danger });
    expect(contagem(/Veículos há mais de/)).toHaveStyle({ color: lightTheme.colors.caution });
    expect(contagem(/Faturas de conveniadas/)).toHaveStyle({ color: lightTheme.colors.info });
  });

  it("sem acesso à tela de destino, a linha aparece mas não é um link", () => {
    renderLista(completos, (area) => area !== "faturas");

    expect(screen.getByText("Faturas de conveniadas abertas")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Faturas de conveniadas abertas/ })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Mensalidades vencem em 5 dias/ })).toBeInTheDocument();
  });

  it("sem pendências mostra Tudo em dia, sem link", () => {
    renderLista(null);

    expect(screen.getByText("Tudo em dia")).toBeInTheDocument();
    expect(screen.getByText("Nenhuma pendência no momento")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("alertas todos nulos também mostram Tudo em dia", () => {
    renderLista({
      mensalistasInadimplentes: null,
      mensalidadesAVencer: null,
      faturasConveniadaAbertas: null,
      caixasComDiferenca: null,
      veiculosParados: null,
    });

    expect(screen.getByText("Tudo em dia")).toBeInTheDocument();
  });
});
