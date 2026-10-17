import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";
import type { PrecoView } from "@/types/preco";
import { PrecoListItem, type PrecoListItemProps } from "./PrecoListItem";

const AGORA = new Date(2026, 9, 17, 12, 0, 0);

function preco(extra: Partial<PrecoView> = {}): PrecoView {
  return {
    rotatividadeId: 7,
    empresaConveniadaId: null,
    descricao: "Tarifa padrão rotativo",
    tipoRegra: 1,
    inicioVigencia: "2026-06-06T00:00:00",
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

function renderItem(props: Partial<PrecoListItemProps> = {}) {
  const onSelecionar = vi.fn();
  const onMoverFoco = vi.fn();
  renderWithTheme(
    <PrecoListItem preco={preco()} selecionado={false} agora={AGORA} onSelecionar={onSelecionar} onMoverFoco={onMoverFoco} {...props} />,
  );
  return { onSelecionar, onMoverFoco };
}

const item = () => screen.getByRole("button");

describe("PrecoListItem", () => {
  it("mostra descrição, tipo e situação em texto", () => {
    renderItem();
    expect(screen.getByText("Tarifa padrão rotativo")).toBeInTheDocument();
    expect(screen.getByText("Padrão")).toBeInTheDocument();
    expect(screen.getByText("Vigente")).toBeInTheDocument();
  });

  it.each([
    [{ tipoRegra: 2 as const }, "Convênio"],
    [{ tipoRegra: 3 as const }, "Promocional"],
    [{ tipoRegra: 4 as const }, "Evento"],
    [{ tipoRegra: null }, "—"],
  ])("tipo %j aparece como %s", (extra, texto) => {
    renderItem({ preco: preco(extra) });
    expect(screen.getByText(texto)).toBeInTheDocument();
  });

  it.each([
    [{ inicioVigencia: "2026-11-27T00:00:00" }, "Agendada"],
    [{ fimVigencia: "2026-06-05T00:00:00" }, "Encerrada"],
    [{ ativo: false }, "Inativa"],
  ])("situação %j aparece como %s", (extra, texto) => {
    renderItem({ preco: preco(extra) });
    expect(screen.getByText(texto)).toBeInTheDocument();
  });

  it("não quebra nem corta uma descrição longa", () => {
    const longa = "Convênio Shopping Central com vigência estendida para clientes do estacionamento rotativo";
    renderItem({ preco: preco({ descricao: longa }) });
    expect(screen.getByText(longa)).toBeInTheDocument();
  });

  it("selecionado fica marcado com aria-current", () => {
    renderItem({ selecionado: true });
    expect(item()).toHaveAttribute("aria-current", "true");
  });

  it("não selecionado não tem aria-current", () => {
    renderItem();
    expect(item()).not.toHaveAttribute("aria-current");
  });

  it("clicar seleciona a tabela pelo id", () => {
    const { onSelecionar } = renderItem();
    fireEvent.click(item());
    expect(onSelecionar).toHaveBeenCalledWith(7);
  });

  it("Enter e Espaço selecionam", async () => {
    const user = userEvent.setup();
    const { onSelecionar } = renderItem();
    item().focus();
    await user.keyboard("{Enter}");
    await user.keyboard(" ");
    expect(onSelecionar).toHaveBeenCalledTimes(2);
  });

  it.each([
    ["{ArrowUp}", "anterior"],
    ["{ArrowDown}", "proximo"],
    ["{Home}", "inicio"],
    ["{End}", "fim"],
  ])("a tecla %s pede para mover o foco (%s)", async (tecla, direcao) => {
    const user = userEvent.setup();
    const { onMoverFoco, onSelecionar } = renderItem();
    item().focus();
    await user.keyboard(tecla);
    expect(onMoverFoco).toHaveBeenCalledWith(direcao);
    expect(onSelecionar).not.toHaveBeenCalled();
  });

  it("outras teclas não movem o foco", async () => {
    const user = userEvent.setup();
    const { onMoverFoco } = renderItem();
    item().focus();
    await user.keyboard("a");
    expect(onMoverFoco).not.toHaveBeenCalled();
  });

  it("sem onMoverFoco as setas não fazem nada", async () => {
    const user = userEvent.setup();
    renderItem({ onMoverFoco: undefined });
    item().focus();
    await user.keyboard("{ArrowDown}");
    expect(item()).toHaveFocus();
  });

  it("aceita o tabIndex do roving tabindex", () => {
    renderItem({ tabIndex: -1 });
    expect(item()).toHaveAttribute("tabindex", "-1");
  });

  it("entrega o ref ao botão para quem coordena o foco", () => {
    const ref = { current: null as HTMLButtonElement | null };
    renderItem({ ref });
    expect(ref.current).toBe(item());
  });
});
