import { fireEvent, render, screen } from "@testing-library/react";
import { useRef } from "react";
import { describe, expect, it } from "vitest";
import { useFocoAposRemocao, vizinhosDe } from "./useFocoAposRemocao";

type Acionado = { id: number; vizinhos: number[]; anuncio: string };

// Lista de botões controlada pelo teste; o botão "marcar" faz o papel do clique que aciona a remoção.
function Lista({ ids, bloqueado, acionado }: { ids: number[]; bloqueado: boolean; acionado: Acionado }) {
  const raiz = useRef<HTMLUListElement>(null);
  const { marcar, anuncio } = useFocoAposRemocao<number>({
    presentes: ids,
    bloqueado,
    alvoDe: (id) => raiz.current?.querySelector<HTMLElement>(`[data-id="${id}"]`) ?? null,
    reserva: () => document.getElementById("reserva"),
  });

  return (
    <>
      <input id="reserva" aria-label="reserva" />
      <button type="button" onClick={() => marcar(acionado)}>
        marcar
      </button>
      <ul ref={raiz}>
        {ids.map((id) => (
          <li key={id}>
            <button type="button" data-id={id}>{`item ${id}`}</button>
          </li>
        ))}
      </ul>
      <span role="status">{anuncio}</span>
    </>
  );
}

function montar(ids: number[], acionado: Acionado = { id: 1, vizinhos: [], anuncio: "" }) {
  const tela = render(<Lista ids={ids} bloqueado={false} acionado={acionado} />);
  const atualizar = (proximos: number[], bloqueado: boolean) =>
    tela.rerender(<Lista ids={proximos} bloqueado={bloqueado} acionado={acionado} />);
  const acionar = () => fireEvent.click(screen.getByRole("button", { name: "marcar" }));
  return { acionar, atualizar };
}

describe("vizinhosDe", () => {
  it("primeiro quem vinha depois, depois quem vinha antes, do mais próximo ao mais distante", () => {
    expect(vizinhosDe([1, 2, 3, 4, 5], 3)).toEqual([4, 5, 2, 1]);
    expect(vizinhosDe([1, 2, 3], 1)).toEqual([2, 3]);
    expect(vizinhosDe([1, 2, 3], 3)).toEqual([2, 1]);
  });

  it("item único ou ausente não tem vizinhos", () => {
    expect(vizinhosDe([1], 1)).toEqual([]);
    expect(vizinhosDe([1, 2], 9)).toEqual([1, 2]);
  });
});

describe("useFocoAposRemocao", () => {
  it("quando o item sai, o foco vai ao vizinho que ocupa o lugar e o leitor de tela é avisado", () => {
    const { acionar, atualizar } = montar([1, 2, 3], { id: 1, vizinhos: [2, 3], anuncio: "1 saiu." });
    acionar();
    atualizar([1, 2, 3], true);

    atualizar([2, 3], true);
    expect(screen.getByText("item 2")).not.toHaveFocus();

    atualizar([2, 3], false);

    expect(screen.getByText("item 2")).toHaveFocus();
    expect(screen.getByRole("status")).toHaveTextContent("1 saiu.");
  });

  it("pula vizinhos que também saíram", () => {
    const { acionar, atualizar } = montar([1, 2, 3], { id: 1, vizinhos: [2, 3], anuncio: "1 saiu." });
    acionar();
    atualizar([1, 2, 3], true);

    atualizar([3], true);
    atualizar([3], false);

    expect(screen.getByText("item 3")).toHaveFocus();
  });

  it("sem vizinho, o foco vai para a reserva", () => {
    const { acionar, atualizar } = montar([1], { id: 1, vizinhos: [], anuncio: "1 saiu." });
    acionar();
    atualizar([1], true);

    atualizar([], true);
    atualizar([], false);

    expect(screen.getByLabelText("reserva")).toHaveFocus();
    expect(screen.getByRole("status")).toHaveTextContent("1 saiu.");
  });

  it("se o item continua na lista (ação cancelada), não mexe no foco nem avisa", () => {
    const { acionar, atualizar } = montar([1, 2], { id: 1, vizinhos: [2], anuncio: "1 saiu." });
    screen.getByText("item 1").focus();
    acionar();
    atualizar([1, 2], true);

    atualizar([1, 2], false);

    expect(screen.getByText("item 1")).toHaveFocus();
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("não mexe em nada enquanto o bloqueio durar", () => {
    const { acionar, atualizar } = montar([1, 2], { id: 1, vizinhos: [2], anuncio: "1 saiu." });
    acionar();
    atualizar([1, 2], true);

    atualizar([2], true);

    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    expect(screen.getByText("item 2")).not.toHaveFocus();
  });

  it("sem item marcado, uma mudança na lista não mexe no foco", () => {
    const { atualizar } = montar([1, 2]);

    atualizar([2], false);

    expect(screen.getByText("item 2")).not.toHaveFocus();
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("cada ação vale uma vez: uma remoção posterior sem marcar não move o foco", () => {
    const { acionar, atualizar } = montar([1, 2, 3], { id: 1, vizinhos: [2, 3], anuncio: "1 saiu." });
    acionar();
    atualizar([1, 2, 3], true);
    atualizar([2, 3], false);
    screen.getByLabelText("reserva").focus();

    atualizar([3], false);

    expect(screen.getByLabelText("reserva")).toHaveFocus();
  });
});
