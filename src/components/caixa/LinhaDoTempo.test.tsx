import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithTheme } from "@/test/render";
import type { EventoCaixa } from "./eventosCaixa";
import { LinhaDoTempo } from "./LinhaDoTempo";

const eventos: EventoCaixa[] = [
  { id: "p", tipo: "passagem", dataHora: "2026-10-23T13:00:00", titulo: "Passagem de turno de Ana para Beto", detalhe: "tudo certo", autor: "Beto" },
  { id: "r", tipo: "retirada", dataHora: "2026-10-23T11:00:00", titulo: "Retirada de R$ 80,00", detalhe: "Cofre", autor: "Ana" },
  { id: "a", tipo: "abertura", dataHora: "2026-10-23T08:00:00", titulo: "Caixa aberto", detalhe: null, autor: "" },
];

describe("LinhaDoTempo", () => {
  it("lista os eventos na ordem recebida, com título, detalhe, hora e autor", () => {
    renderWithTheme(<LinhaDoTempo eventos={eventos} />);

    const itens = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(itens).toHaveLength(3);
    expect(itens[0]).toHaveTextContent("Passagem de turno de Ana para Beto");
    expect(itens[0]).toHaveTextContent("tudo certo");
    expect(itens[0]).toHaveTextContent("Beto");
    expect(itens[1]).toHaveTextContent("Retirada de R$ 80,00");
    expect(itens[1]).toHaveTextContent("Cofre");
    expect(itens[2]).toHaveTextContent("Caixa aberto");
  });

  it("não mostra autor nem detalhe quando faltam", () => {
    renderWithTheme(<LinhaDoTempo eventos={[eventos[2]]} />);

    expect(screen.getByRole("listitem").textContent).not.toContain("·");
  });

  it("a lista é nomeada para leitor de tela e os marcadores são decorativos", () => {
    const { container } = renderWithTheme(<LinhaDoTempo eventos={eventos} />);

    expect(screen.getByRole("list", { name: /Eventos do caixa/ })).toBeInTheDocument();
    expect(container.querySelectorAll('li > span[aria-hidden="true"]')).toHaveLength(3);
  });

  it("sem eventos fica uma lista vazia", () => {
    renderWithTheme(<LinhaDoTempo eventos={[]} />);

    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });
});
