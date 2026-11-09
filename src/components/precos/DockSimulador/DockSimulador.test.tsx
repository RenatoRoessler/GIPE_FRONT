import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it } from "vitest";
import { renderWithTheme } from "@/test/render";
import { TIPO_CATEGORIA, TIPO_REGRA, type PrecoView } from "@/types/preco";
import { AVISO_ESTIMATIVA } from "../SimuladorCobranca";
import { DockSimulador } from "./DockSimulador";

// jsdom não implementa <dialog>.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

function preco(extra: Partial<PrecoView> = {}): PrecoView {
  return {
    rotatividadeId: 1,
    empresaConveniadaId: null,
    descricao: "Tarifa padrão",
    tipoRegra: TIPO_REGRA.Padrao,
    inicioVigencia: "2026-06-06T00:00:00",
    fimVigencia: null,
    toleranciaEntradaMinutos: 10,
    toleranciaAlteracaoFaixaMinutos: 0,
    periodoDiaria: 720,
    valorDiaria: 35,
    valorAdicionalDiaria: 1,
    ativo: true,
    regras: [],
    faixas: [
      { minutosLimite: 60, valor: 10, percentualConveniada: null },
      { minutosLimite: 120, valor: 16, percentualConveniada: null },
      { minutosLimite: 180, valor: 20, percentualConveniada: null },
    ],
    categorias: [TIPO_CATEGORIA.Todas],
    ...extra,
  };
}

describe("DockSimulador", () => {
  it("mostra a categoria, a permanência, o rótulo de estimativa e o valor", () => {
    renderWithTheme(<DockSimulador preco={preco()} />);
    const dock = screen.getByRole("region", { name: "Simulador de cobrança" });
    expect(dock).toHaveTextContent("Simular · Carro médio · 2 h 30 min · estimativa");
    expect(dock).toHaveTextContent(/R\$\s20,00/);
  });

  it("Ajustar abre a folha com o simulador completo e o aviso de estimativa", async () => {
    renderWithTheme(<DockSimulador preco={preco()} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Ajustar" }));
    const folha = screen.getByRole("dialog", { name: "Simular cobrança" });
    expect(folha).toHaveTextContent(AVISO_ESTIMATIVA);
    expect(screen.getByLabelText("Categoria")).toBeInTheDocument();
  });

  it("o que muda na folha aparece no dock", async () => {
    renderWithTheme(<DockSimulador preco={preco()} />);
    await userEvent.click(screen.getByRole("button", { name: "Ajustar" }));
    fireEvent.change(screen.getByLabelText("Permanência (minutos)"), { target: { value: "60" } });
    const dock = screen.getByRole("region", { name: "Simulador de cobrança", hidden: true });
    expect(dock).toHaveTextContent("1 h");
    expect(dock).toHaveTextContent(/R\$\s10,00/);
  });

  it("diz quando a tabela não vale para a categoria escolhida", async () => {
    renderWithTheme(<DockSimulador preco={preco({ categorias: [TIPO_CATEGORIA.Moto] })} />);
    // A tabela abre na primeira categoria que atende (Moto); trocar para outra mostra o aviso.
    await userEvent.click(screen.getByRole("button", { name: "Ajustar" }));
    await userEvent.selectOptions(screen.getByLabelText("Categoria"), String(TIPO_CATEGORIA.Caminhao));
    expect(screen.getByRole("region", { name: "Simulador de cobrança", hidden: true })).toHaveTextContent("Não vale para Caminhão");
  });

  it("remontar com outra tabela volta ao padrão", () => {
    const { rerender } = renderWithTheme(<DockSimulador key={1} preco={preco()} />);
    rerender(<DockSimulador key={2} preco={preco({ rotatividadeId: 2, categorias: [TIPO_CATEGORIA.Moto] })} />);
    expect(screen.getByRole("region", { name: "Simulador de cobrança" })).toHaveTextContent("Moto");
  });
});
