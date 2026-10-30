import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";
import { AGRUPAMENTO_FLUXO, type FluxoPeriodo } from "@/types/financeiro";
import { ReguaSaldo } from "./ReguaSaldo";

function periodo(data: string, entradas = 0, saidas = 0, saldoAcumulado = 0): FluxoPeriodo {
  return { data, entradas, saidas, saldo: entradas - saidas, saldoAcumulado };
}

const outubro: FluxoPeriodo[] = [
  periodo("2026-10-20", 35, 0, 175),
  periodo("2026-10-21", 0, 0, 175),
  periodo("2026-10-22", 32800, 450, 32525),
  periodo("2026-10-23", 18120, 0, 50645),
];

// O gráfico é decorativo para quem usa leitor de tela: o resumo e o anúncio do ponto ativo é que valem.
const grafico = () => screen.getByRole("group", { name: /Evolução do saldo/ });
const colunas = (container: HTMLElement) => container.querySelectorAll("[data-coluna]");
const anuncio = () => grafico().querySelector("[aria-live]") as HTMLElement;

function renderRegua(periodos = outubro, agrupamento: 1 | 2 = AGRUPAMENTO_FLUXO.Dia, onVerPorMes = vi.fn()) {
  const resultado = renderWithTheme(<ReguaSaldo periodos={periodos} agrupamento={agrupamento} onVerPorMes={onVerPorMes} />);
  return { ...resultado, onVerPorMes };
}

describe("ReguaSaldo", () => {
  it("desenha uma coluna por dia e a linha do saldo acumulado", () => {
    const { container } = renderRegua();

    expect(colunas(container)).toHaveLength(4);
    expect(container.querySelector("polyline")).toBeInTheDocument();
  });

  it("o resumo para leitores de tela diz a evolução, a maior entrada e como navegar", () => {
    renderRegua();

    const rotulo = grafico().getAttribute("aria-label") ?? "";
    expect(rotulo).toMatch(/Saldo acumulado de R\$\s*175,00 a R\$\s*50\.645,00\./);
    expect(rotulo).toMatch(/Maior entrada em 22\/10: R\$\s*32\.800,00\./);
    expect(rotulo).toMatch(/Use as setas para ver os dias\./);
    expect(grafico()).toHaveAttribute("aria-roledescription", "gráfico");
  });

  it("por mês, o resumo fala em meses", () => {
    renderRegua([periodo("2026-09-01", 10, 0, 10), periodo("2026-10-01", 20, 0, 30)], AGRUPAMENTO_FLUXO.Mes);

    expect(grafico().getAttribute("aria-label")).toMatch(/Use as setas para ver os meses\./);
  });

  it("o teclado percorre as colunas e o ponto ativo é anunciado", async () => {
    renderRegua();
    const user = userEvent.setup();
    await user.tab();
    expect(grafico()).toHaveFocus();
    expect(anuncio()).toHaveTextContent("");

    await user.keyboard("{ArrowRight}");
    expect(anuncio()).toHaveTextContent(/Ter, 20\/10\/2026\. Entradas R\$\s*35,00, saídas R\$\s*0,00/);

    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(anuncio()).toHaveTextContent(/22\/10\/2026\. Entradas R\$\s*32\.800,00, saídas R\$\s*450,00, saldo R\$\s*32\.350,00, saldo acumulado R\$\s*32\.525,00/);

    await user.keyboard("{End}");
    expect(anuncio()).toHaveTextContent(/23\/10\/2026/);

    await user.keyboard("{Home}");
    expect(anuncio()).toHaveTextContent(/20\/10\/2026/);
  });

  it("não passa das pontas", async () => {
    renderRegua();
    const user = userEvent.setup();
    await user.tab();

    await user.keyboard("{ArrowLeft}");
    expect(anuncio()).toHaveTextContent(/23\/10\/2026/);
    await user.keyboard("{ArrowRight}");
    expect(anuncio()).toHaveTextContent(/23\/10\/2026/);
  });

  it("dia sem movimento é anunciado como tal", async () => {
    renderRegua();
    const user = userEvent.setup();
    await user.tab();

    // Primeira seta: 20/10; segunda: 21/10, que não teve movimento.
    await user.keyboard("{ArrowRight}{ArrowRight}");

    expect(anuncio()).toHaveTextContent(/21\/10\/2026\. Sem movimento\. Saldo acumulado R\$\s*175,00/);
  });

  it("Esc apaga o ponto ativo", async () => {
    renderRegua();
    const user = userEvent.setup();
    await user.tab();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByText("Entradas", { selector: "dt" })).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(screen.queryByText("Entradas", { selector: "dt" })).not.toBeInTheDocument();
    expect(anuncio()).toHaveTextContent("");
  });

  it("mouse e toque mostram o balão com os valores do dia", () => {
    const { container } = renderRegua();

    fireEvent.mouseEnter(colunas(container)[2]);

    expect(screen.getByText("Qui, 22/10/2026")).toBeInTheDocument();
    expect(screen.getByText("Entradas", { selector: "dt" })).toBeInTheDocument();
    expect(screen.getByText(/R\$\s*32\.800,00/, { selector: "dd" })).toBeInTheDocument();
    expect(screen.getByText("Acumulado", { selector: "dt" })).toBeInTheDocument();

    fireEvent.mouseLeave(grafico());
    expect(screen.queryByText("Qui, 22/10/2026")).not.toBeInTheDocument();

    fireEvent.click(colunas(container)[0]);
    expect(screen.getByText("Ter, 20/10/2026")).toBeInTheDocument();
  });

  it("no balão, dia sem movimento diz isso e mostra só o acumulado", () => {
    const { container } = renderRegua();

    fireEvent.mouseEnter(colunas(container)[1]);

    expect(screen.getByText("Sem movimento")).toBeInTheDocument();
    expect(screen.queryByText("Entradas", { selector: "dt" })).not.toBeInTheDocument();
    expect(screen.getByText("Acumulado", { selector: "dt" })).toBeInTheDocument();
  });

  it("por mês, o balão traz o mês por extenso", () => {
    const { container } = renderRegua([periodo("2026-09-01", 10, 0, 10), periodo("2026-10-01", 20, 0, 30)], AGRUPAMENTO_FLUXO.Mes);

    fireEvent.mouseEnter(colunas(container)[1]);

    expect(screen.getByText("Outubro de 2026")).toBeInTheDocument();
  });

  it("saldo acumulado negativo é sombreado; só positivo, não", () => {
    const { container, unmount } = renderRegua([periodo("2026-10-01", 0, 50, -50), periodo("2026-10-02", 100, 0, 50)]);
    expect(container.querySelector("polygon")).toBeInTheDocument();
    unmount();

    const outra = renderRegua();
    expect(outra.container.querySelector("polygon")).not.toBeInTheDocument();
  });

  it("período sem entradas nem saídas mostra a mensagem e não desenha colunas", () => {
    const { container } = renderRegua([periodo("2026-10-01"), periodo("2026-10-02")]);

    expect(screen.getByText("Nenhuma entrada ou saída neste período.")).toBeInTheDocument();
    expect(colunas(container)).toHaveLength(0);
    expect(screen.queryByRole("group", { name: /Evolução do saldo/ })).not.toBeInTheDocument();
  });

  describe("período longo", () => {
    const longo = Array.from({ length: 120 }, (_, indice) => periodo(`2026-${String(1 + Math.floor(indice / 28)).padStart(2, "0")}-${String((indice % 28) + 1).padStart(2, "0")}`, indice === 5 ? 100 : 0));

    it("por dia, com mais de 92 pontos, sugere ver por mês", async () => {
      const { onVerPorMes } = renderRegua(longo);

      await userEvent.setup().click(screen.getByRole("button", { name: "Ver por mês" }));

      expect(onVerPorMes).toHaveBeenCalled();
    });

    it("com 92 pontos ou menos, não sugere", () => {
      renderRegua(longo.slice(0, 92));
      expect(screen.queryByRole("button", { name: "Ver por mês" })).not.toBeInTheDocument();
    });

    it("por mês, não sugere", () => {
      renderRegua(longo, AGRUPAMENTO_FLUXO.Mes);
      expect(screen.queryByRole("button", { name: "Ver por mês" })).not.toBeInTheDocument();
    });
  });
});
