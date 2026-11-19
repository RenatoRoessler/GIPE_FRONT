import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { dashboardDto, dashboardEmpresaNovaDto, dashboardMesFechadoDto } from "@/lib/api/services/dashboard.fixture";
import { fromDashboardResponse } from "@/lib/api/services/dashboard.mapper";
import { lightTheme } from "@/styles/theme";
import { renderWithTheme } from "@/test/render";
import { PERIODO_DASHBOARD, type Dashboard } from "@/types/dashboard";
import { MovimentoPorHora } from "./MovimentoPorHora";

const agora = new Date(2026, 10, 19, 15, 45);
const exemplo = () => fromDashboardResponse(dashboardDto);
const outubro = () => fromDashboardResponse(dashboardMesFechadoDto());

function renderMovimento(dashboard: Dashboard, opcoes: { capacidade?: number } = {}) {
  return renderWithTheme(
    <MovimentoPorHora
      movimento={dashboard.movimentoPorHora}
      periodo={dashboard.periodo}
      inicioUso={dashboard.inicioUso}
      capacidade={opcoes.capacidade ?? dashboard.patio?.capacidade ?? 0}
      agora={agora}
    />,
  );
}

// Faz a tela parecer estreita (< sm) ou média (< lg) para o agrupamento de horas.
function telaComLargura(largura: number) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => {
      const maximo = Number(/max-width:\s*(\d+)px/.exec(query)?.[1] ?? Infinity);
      return { matches: largura <= maximo, media: query, addEventListener: vi.fn(), removeEventListener: vi.fn() };
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

const colunas = () => within(screen.getByRole("group", { name: "Veículos no pátio por hora" })).getAllByRole("button");

describe("MovimentoPorHora", () => {
  it("resposta de exemplo: título de hoje, 16 colunas com dado (0h a 15h) e 8 horas que ainda não chegaram", () => {
    const { container } = renderMovimento(exemplo());

    expect(screen.getByRole("heading", { name: "Veículos no pátio por hora · hoje" })).toBeInTheDocument();
    expect(colunas()).toHaveLength(16);
    expect(container.querySelectorAll("[data-futura]")).toHaveLength(8);
    expect(container.querySelector("[data-futura]")).toHaveStyle({ borderStyle: "dashed" });
  });

  it("hoje abre na hora atual, com o detalhe dela", () => {
    renderMovimento(exemplo());

    expect(screen.getByRole("button", { name: "15h a 16h: 17 veículos" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("15h – 16h")).toBeInTheDocument();
    expect(screen.getByText("17 veículos no pátio · 15% das vagas")).toBeInTheDocument();
    expect(screen.getByText("0 entradas nessa hora")).toBeInTheDocument();
  });

  it("mostra as faixas de maior e menor movimento", () => {
    renderMovimento(exemplo());

    const faixas = screen.getAllByRole("listitem");
    expect(faixas.map((faixa) => faixa.textContent)).toEqual(["Maior movimento0h – 3h17 veículos", "Menor movimento0h – 3h17 veículos"]);
  });

  it("as horas da faixa de maior movimento ficam no amarelo da marca e as demais no tom neutro", () => {
    renderMovimento(exemplo());

    expect(screen.getByRole("button", { name: "1h a 2h: 17 veículos" }).lastElementChild).toHaveStyle({ backgroundColor: lightTheme.colors.primary });
    expect(screen.getByRole("button", { name: "3h a 4h: 17 veículos" }).lastElementChild).toHaveStyle({ backgroundColor: lightTheme.colors.surfaceMuted });
  });

  it("o eixo mostra 0h, 6h, 12h, 18h e 23h", () => {
    renderMovimento(exemplo());

    for (const hora of ["0h", "6h", "12h", "18h", "23h"]) {
      expect(screen.getAllByText(hora).length).toBeGreaterThan(0);
    }
  });

  it("escolher uma hora mostra o detalhe dela", async () => {
    const user = userEvent.setup();
    renderMovimento(exemplo());

    await user.click(screen.getByRole("button", { name: "8h a 9h: 17 veículos" }));

    expect(screen.getByRole("button", { name: "8h a 9h: 17 veículos" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "15h a 16h: 17 veículos" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("8h – 9h")).toBeInTheDocument();
  });

  it("tem um só ponto de tabulação e as setas, Home e End andam entre as horas com dado", async () => {
    const user = userEvent.setup();
    renderMovimento(exemplo());

    expect(colunas().filter((botao) => botao.tabIndex === 0)).toHaveLength(1);

    await user.tab();
    expect(screen.getByRole("button", { name: "15h a 16h: 17 veículos" })).toHaveFocus();

    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("button", { name: "15h a 16h: 17 veículos" })).toHaveFocus();

    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("button", { name: "14h a 15h: 17 veículos" })).toHaveFocus();
    expect(screen.getByText("14h – 15h")).toBeInTheDocument();

    await user.keyboard("{Home}");
    expect(screen.getByRole("button", { name: "0h a 1h: 17 veículos" })).toHaveFocus();

    await user.keyboard("{End}");
    expect(screen.getByRole("button", { name: "15h a 16h: 17 veículos" })).toHaveFocus();
  });

  it("média do mês: título, detalhe em média e abre na hora seguinte ao início do maior movimento", () => {
    renderMovimento(outubro(), { capacidade: 110 });

    expect(screen.getByRole("heading", { name: "Veículos no pátio por hora · média do mês" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "17h a 18h: 57 veículos", pressed: true })).toBeInTheDocument();
    expect(screen.getByText("57 veículos no pátio em média · 52% das vagas")).toBeInTheDocument();
    expect(screen.getByText("6 entradas em média nessa hora")).toBeInTheDocument();
    expect(screen.getByText("Maior movimento")).toBeInTheDocument();
    expect(screen.getByText("16h – 19h")).toBeInTheDocument();
  });

  it("período fechado, sem pátio: não diz a % das vagas", () => {
    renderMovimento(outubro(), { capacidade: 0 });

    expect(screen.getByText("57 veículos no pátio em média")).toBeInTheDocument();
  });

  it("em tela estreita agrupa de 2 em 2 horas, na média, com a faixa de 2 horas", () => {
    telaComLargura(375);
    renderMovimento(exemplo());

    expect(colunas()).toHaveLength(8);
    expect(screen.getByRole("button", { name: "14h a 16h: 17 veículos", pressed: true })).toBeInTheDocument();
    expect(screen.getByText("14h – 16h")).toBeInTheDocument();
    expect(screen.getByText("17 veículos no pátio em média · 15% das vagas")).toBeInTheDocument();
    expect(screen.getByText("0 entradas nessas 2 horas")).toBeInTheDocument();
  });

  it("em tela média agrupa só quando os números têm 3 dígitos", () => {
    telaComLargura(800);
    const { unmount } = renderMovimento(exemplo());
    expect(colunas()).toHaveLength(16);
    unmount();

    const cheio = outubro();
    const muitos = { ...cheio, movimentoPorHora: { ...cheio.movimentoPorHora!, horas: cheio.movimentoPorHora!.horas.map((hora) => (hora ? { ...hora, veiculos: 120 } : hora)) } };
    renderMovimento(muitos, { capacidade: 150 });

    expect(colunas()).toHaveLength(12);
  });

  it("em tela larga nunca agrupa", () => {
    telaComLargura(1400);
    renderMovimento(outubro(), { capacidade: 110 });

    expect(colunas()).toHaveLength(24);
  });

  it("empresa nova: só a frase de vazio", () => {
    renderMovimento(fromDashboardResponse(dashboardEmpresaNovaDto()));

    expect(screen.getByText("Aparece a partir do primeiro dia com veículos no pátio.")).toBeInTheDocument();
    expect(screen.queryByRole("group")).not.toBeInTheDocument();
  });

  it("semana ou mês com menos de 7 dias de uso: explica e aponta o seletor Dia", () => {
    const dashboard = exemplo();
    renderWithTheme(
      <MovimentoPorHora
        movimento={null}
        periodo={{ ...dashboard.periodo, tipo: PERIODO_DASHBOARD.Semana }}
        inicioUso={dashboard.inicioUso}
        capacidade={110}
        agora={agora}
      />,
    );

    expect(screen.getByRole("heading", { name: "Veículos no pátio por hora · média da semana" })).toBeInTheDocument();
    expect(screen.getByText("As médias por hora aparecem depois de 7 dias de uso. No seletor Dia você já vê cada dia.")).toBeInTheDocument();
  });

  it("a escolha some quando chega outra resposta", async () => {
    const user = userEvent.setup();
    const { rerender } = renderMovimento(exemplo());
    await user.click(screen.getByRole("button", { name: "8h a 9h: 17 veículos" }));

    const novo = exemplo();
    rerender(<MovimentoPorHora movimento={novo.movimentoPorHora} periodo={novo.periodo} inicioUso={novo.inicioUso} capacidade={110} agora={agora} />);

    expect(screen.getByRole("button", { name: "15h a 16h: 17 veículos" })).toHaveAttribute("aria-pressed", "true");
  });
});
