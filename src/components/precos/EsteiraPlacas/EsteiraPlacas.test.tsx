import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { PrecoView } from "@/types/preco";
import { renderWithTheme } from "@/test/render";
import { EsteiraPlacas } from "./EsteiraPlacas";

const AGORA = new Date(2026, 10, 8, 12, 0, 0);

function preco(id: number, extra: Partial<PrecoView> = {}): PrecoView {
  return {
    rotatividadeId: id,
    empresaConveniadaId: null,
    descricao: `Tabela ${id}`,
    tipoRegra: 1,
    inicioVigencia: "2026-01-01T00:00:00",
    fimVigencia: null,
    toleranciaEntradaMinutos: 0,
    toleranciaAlteracaoFaixaMinutos: 0,
    periodoDiaria: 720,
    valorDiaria: 0,
    valorAdicionalDiaria: 0,
    ativo: true,
    regras: [],
    faixas: [],
    categorias: [],
    ...extra,
  };
}

const COM_VALORES = preco(1, {
  descricao: "Final de semana",
  valorDiaria: 100,
  faixas: [
    { minutosLimite: 120, valor: 25, percentualConveniada: null },
    { minutosLimite: 60, valor: 15, percentualConveniada: null },
    { minutosLimite: 180, valor: 30, percentualConveniada: null },
  ],
});
const SEM_VALORES = preco(2, { descricao: "Evento", tipoRegra: 4 });
const CONVENIO = preco(3, { descricao: "Convênio", tipoRegra: 2 });

function renderizar(selecionadaId: number | null = 1, onSelecionar = vi.fn()) {
  renderWithTheme(<EsteiraPlacas itens={[COM_VALORES, SEM_VALORES, CONVENIO]} selecionadaId={selecionadaId} onSelecionar={onSelecionar} agora={AGORA} />);
  return onSelecionar;
}

describe("EsteiraPlacas", () => {
  it("mostra nome, tipo em texto, situação, o primeiro degrau por tempo e a diária", () => {
    renderizar();
    const placa = screen.getByRole("button", { name: /Final de semana/ });
    expect(within(placa).getByText("Padrão")).toBeInTheDocument();
    expect(within(placa).getByText("Vigente")).toBeInTheDocument();
    expect(within(placa).getByText("R$ 15,00")).toBeInTheDocument();
    expect(within(placa).queryByText("R$ 25,00")).not.toBeInTheDocument();
    expect(within(placa).getByText("R$ 100,00")).toBeInTheDocument();
  });

  it("sem diária mostra os dois primeiros degraus", () => {
    renderWithTheme(
      <EsteiraPlacas
        itens={[preco(9, { descricao: "Sem diária", faixas: COM_VALORES.faixas })]}
        selecionadaId={9}
        onSelecionar={vi.fn()}
        agora={AGORA}
      />,
    );
    const placa = screen.getByRole("button", { name: /Sem diária/ });
    expect(within(placa).getByText("R$ 15,00")).toBeInTheDocument();
    expect(within(placa).getByText("R$ 25,00")).toBeInTheDocument();
    expect(within(placa).queryByText("R$ 30,00")).not.toBeInTheDocument();
  });

  it("sem degraus nem diária mostra 'Sem valores'", () => {
    renderizar();
    expect(within(screen.getByRole("button", { name: /Evento/ })).getByText("Sem valores")).toBeInTheDocument();
  });

  it("marca a selecionada com aria-current e escolhe pelo toque", async () => {
    const onSelecionar = renderizar(1);
    expect(screen.getByRole("button", { name: /Final de semana/ })).toHaveAttribute("aria-current", "true");
    await userEvent.click(screen.getByRole("button", { name: /Convênio/ }));
    expect(onSelecionar).toHaveBeenCalledWith(3);
  });

  it("só a selecionada entra na ordem de Tab; sem seleção, a primeira", () => {
    renderizar(2);
    expect(screen.getByRole("button", { name: /Evento/ })).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("button", { name: /Final de semana/ })).toHaveAttribute("tabindex", "-1");
  });

  it("as setas, Home e End movem o foco entre as placas sem passar das pontas", async () => {
    renderizar(1);
    screen.getByRole("button", { name: /Final de semana/ }).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("button", { name: /Evento/ })).toHaveFocus();
    await userEvent.keyboard("{End}");
    expect(screen.getByRole("button", { name: /Convênio/ })).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("button", { name: /Convênio/ })).toHaveFocus();
    await userEvent.keyboard("{Home}");
    expect(screen.getByRole("button", { name: /Final de semana/ })).toHaveFocus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(screen.getByRole("button", { name: /Final de semana/ })).toHaveFocus();
  });

  it("tem a lista nomeada para leitores de tela", () => {
    renderizar();
    expect(screen.getByRole("list", { name: "Escolher tabela de preço" })).toBeInTheDocument();
  });
});
