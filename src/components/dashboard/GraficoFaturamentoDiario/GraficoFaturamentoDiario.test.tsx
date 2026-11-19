import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { dashboardDto, dashboardEmpresaNovaDto, dashboardMesFechadoDto } from "@/lib/api/services/dashboard.fixture";
import { fromDashboardResponse } from "@/lib/api/services/dashboard.mapper";
import { lightTheme } from "@/styles/theme";
import { renderWithTheme } from "@/test/render";
import type { Dashboard } from "@/types/dashboard";
import { GraficoFaturamentoDiario } from "./GraficoFaturamentoDiario";

const hoje = new Date(2026, 10, 19, 15, 45);
const exemplo = () => fromDashboardResponse(dashboardDto);

function renderGrafico(dashboard: Dashboard) {
  return renderWithTheme(<GraficoFaturamentoDiario dashboard={dashboard} hoje={hoje} />);
}

const colunas = () => screen.getAllByRole("button");
const coluna = (nome: string) => screen.getByRole("button", { name: nome });

describe("GraficoFaturamentoDiario", () => {
  it("resposta de exemplo: 13 dias com uso (botões) e 17 lacunas tracejadas antes do início do uso", () => {
    const { container } = renderGrafico(exemplo());

    expect(screen.getByRole("heading", { name: "Faturamento · 30 dias até hoje" })).toBeInTheDocument();
    expect(colunas()).toHaveLength(13);
    expect(container.querySelectorAll("[data-lacuna]")).toHaveLength(17);
    expect(container.querySelector("[data-lacuna]")).toHaveStyle({ borderStyle: "dashed" });
  });

  it("cada coluna tem nome com o dia e o valor", () => {
    renderGrafico(exemplo());

    expect(coluna("seg, 9 nov: R$ 638,00")).toBeInTheDocument();
    expect(coluna("qui, 19 nov: R$ 0,00")).toBeInTheDocument();
    expect(coluna("qua, 18 nov: R$ 100,00")).toBeInTheDocument();
  });

  it("a legenda mostra só as origens com valor", () => {
    renderGrafico(exemplo());

    const legenda = within(screen.getByRole("list", { name: "Origens do faturamento" }));
    expect(legenda.getAllByRole("listitem").map((item) => item.textContent)).toEqual(["Avulso", "Convênio", "Lava-rápido"]);
  });

  it("o eixo mostra o primeiro dia, o do meio e Hoje", () => {
    renderGrafico(exemplo());

    expect(screen.getByText("21 out")).toBeInTheDocument();
    expect(screen.getByText("5 nov")).toBeInTheDocument();
    expect(screen.getByText("Hoje")).toBeInTheDocument();
  });

  it("o gráfico é um grupo descrito por um resumo para leitor de tela", () => {
    renderGrafico(exemplo());

    expect(screen.getByRole("group", { name: "Faturamento por dia" })).toHaveAccessibleDescription(
      "Faturamento de 21 out a 19 nov: total de R$ 1.404, melhor dia seg, 9 nov, com R$ 638.",
    );
  });

  it("empilha as origens de cada dia, na cor de cada uma", () => {
    renderGrafico(exemplo());

    const barra = coluna("seg, 9 nov: R$ 638,00").firstElementChild as HTMLElement;
    expect(barra.children).toHaveLength(1);
    expect(barra.firstElementChild).toHaveStyle({ backgroundColor: lightTheme.colors.cliente.avulso });

    const lava = (coluna("qua, 18 nov: R$ 100,00").firstElementChild as HTMLElement).firstElementChild;
    expect(lava).toHaveStyle({ backgroundColor: lightTheme.colors.primary });
  });

  it("a altura é relativa ao maior dia, e dia sem faturamento ainda aparece como uma linha fina", () => {
    renderGrafico(exemplo());

    expect(coluna("seg, 9 nov: R$ 638,00").firstElementChild).toHaveStyle({ height: "100%" });
    expect(coluna("sáb, 14 nov: R$ 0,00").firstElementChild).toHaveStyle({ height: "0%", minHeight: "2px" });
  });

  it("no Dia, só o dia escolhido está em destaque e os outros esmaecidos", () => {
    renderGrafico(exemplo());

    expect(coluna("qui, 19 nov: R$ 0,00")).toHaveStyle({ opacity: "1" });
    expect(coluna("seg, 9 nov: R$ 638,00")).toHaveStyle({ opacity: "0.35" });
  });

  it("passar o mouse num dia mostra o detalhe com o valor de cada origem, e sair o limpa", async () => {
    const user = userEvent.setup();
    const { container } = renderGrafico(exemplo());
    expect(screen.getByText(/Passe o mouse, toque ou use as setas/)).toBeInTheDocument();

    await user.hover(coluna("qua, 18 nov: R$ 100,00"));

    expect(screen.getByText("qua, 18 nov · R$ 100,00")).toBeInTheDocument();
    expect(screen.getByText("Lava-rápido R$ 100")).toBeInTheDocument();

    await user.unhover(container.querySelector("[role='group']") as HTMLElement);

    expect(screen.queryByText("qua, 18 nov · R$ 100,00")).not.toBeInTheDocument();
  });

  it("tocar num dia seleciona e tocar fora do gráfico limpa", async () => {
    const user = userEvent.setup();
    renderGrafico(exemplo());

    await user.click(coluna("seg, 9 nov: R$ 638,00"));
    expect(screen.getByText("seg, 9 nov · R$ 638,00")).toBeInTheDocument();
    expect(screen.getByText("Avulso R$ 638")).toBeInTheDocument();

    await user.click(document.body);

    expect(screen.queryByText("seg, 9 nov · R$ 638,00")).not.toBeInTheDocument();
  });

  it("tirar o foco do gráfico limpa a seleção", async () => {
    const user = userEvent.setup();
    renderGrafico(exemplo());

    await user.tab();
    expect(screen.getByText("qui, 19 nov · R$ 0,00")).toBeInTheDocument();

    await user.tab();

    expect(screen.queryByText("qui, 19 nov · R$ 0,00")).not.toBeInTheDocument();
  });

  it("dia sem faturamento diz isso no detalhe", async () => {
    const user = userEvent.setup();
    renderGrafico(exemplo());

    await user.click(coluna("sáb, 14 nov: R$ 0,00"));

    expect(screen.getByText("Sem faturamento neste dia")).toBeInTheDocument();
  });

  it("tem um só ponto de tabulação: o último dia com uso", () => {
    renderGrafico(exemplo());

    const tabulaveis = colunas().filter((botao) => botao.tabIndex === 0);
    expect(tabulaveis).toHaveLength(1);
    expect(tabulaveis[0]).toHaveAccessibleName("qui, 19 nov: R$ 0,00");
  });

  it("← e → andam entre os dias com uso, Home e End vão às pontas e Esc limpa a seleção", async () => {
    const user = userEvent.setup();
    renderGrafico(exemplo());

    await user.tab();
    expect(coluna("qui, 19 nov: R$ 0,00")).toHaveFocus();

    await user.keyboard("{ArrowLeft}");
    expect(coluna("qua, 18 nov: R$ 100,00")).toHaveFocus();
    expect(screen.getByText("qua, 18 nov · R$ 100,00")).toBeInTheDocument();

    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(coluna("qui, 19 nov: R$ 0,00")).toHaveFocus();

    await user.keyboard("{Home}");
    expect(coluna("sáb, 7 nov: R$ 171,00")).toHaveFocus();

    await user.keyboard("{ArrowLeft}");
    expect(coluna("sáb, 7 nov: R$ 171,00")).toHaveFocus();

    await user.keyboard("{End}");
    expect(coluna("qui, 19 nov: R$ 0,00")).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(screen.getByText(/Passe o mouse, toque ou use as setas/)).toBeInTheDocument();
    expect(coluna("qui, 19 nov: R$ 0,00")).toHaveFocus();
  });

  it("o ponto de tabulação acompanha a seleção", async () => {
    const user = userEvent.setup();
    renderGrafico(exemplo());

    await user.click(coluna("seg, 9 nov: R$ 638,00"));

    expect(coluna("seg, 9 nov: R$ 638,00")).toHaveAttribute("tabindex", "0");
    expect(coluna("qui, 19 nov: R$ 0,00")).toHaveAttribute("tabindex", "-1");
  });

  it("a seleção some quando chega outro período", async () => {
    const user = userEvent.setup();
    const { rerender } = renderGrafico(exemplo());
    await user.click(coluna("seg, 9 nov: R$ 638,00"));
    expect(screen.getByText("seg, 9 nov · R$ 638,00")).toBeInTheDocument();

    rerender(<GraficoFaturamentoDiario dashboard={fromDashboardResponse(dashboardMesFechadoDto())} hoje={hoje} />);

    expect(screen.queryByText("seg, 9 nov · R$ 638,00")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Faturamento por dia · outubro" })).toBeInTheDocument();
  });

  it("mês fechado: todos os dias do mês, sem esmaecer nenhum, com as quatro origens na legenda", () => {
    const { container } = renderGrafico(fromDashboardResponse(dashboardMesFechadoDto()));

    expect(colunas()).toHaveLength(31);
    expect(container.querySelectorAll("[data-lacuna]")).toHaveLength(0);
    expect(colunas().every((botao) => getComputedStyle(botao).opacity === "1")).toBe(true);
    expect(within(screen.getByRole("list", { name: "Origens do faturamento" })).getAllByRole("listitem")).toHaveLength(4);
    expect(screen.getByText("31 out")).toBeInTheDocument();
  });

  it("empresa nova: só a frase de vazio, sem colunas nem legenda", () => {
    renderGrafico(fromDashboardResponse(dashboardEmpresaNovaDto()));

    expect(screen.getByText("O gráfico começa a aparecer a partir do primeiro dia com saídas registradas.")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    expect(screen.queryByRole("group")).not.toBeInTheDocument();
  });
});
