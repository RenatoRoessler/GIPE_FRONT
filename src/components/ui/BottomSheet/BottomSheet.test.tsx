import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";
import { BottomSheet } from "./BottomSheet";

// jsdom não implementa <dialog>; como o navegador, showModal foca o primeiro controle.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
    this.querySelector<HTMLElement>("button")?.focus();
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
});

describe("BottomSheet", () => {
  it("abre com o título como nome acessível e mostra o conteúdo", () => {
    renderWithTheme(
      <BottomSheet open title="Simular cobrança" onClose={vi.fn()}>
        <p>Conteúdo</p>
      </BottomSheet>,
    );
    expect(screen.getByRole("dialog", { name: "Simular cobrança" })).toBeInTheDocument();
    expect(screen.getByText("Conteúdo")).toBeInTheDocument();
  });

  it("não abre quando open é falso", () => {
    renderWithTheme(
      <BottomSheet open={false} title="Simular cobrança" onClose={vi.fn()}>
        <p>Conteúdo</p>
      </BottomSheet>,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("fecha pelo botão, pelo Esc (cancel) e pelo clique no fundo", async () => {
    const onClose = vi.fn();
    renderWithTheme(
      <BottomSheet open title="Folha" onClose={onClose}>
        <p>Conteúdo</p>
      </BottomSheet>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Fechar" }));
    expect(onClose).toHaveBeenCalledTimes(1);

    const dialog = screen.getByRole("dialog");
    fireEvent(dialog, new Event("cancel", { cancelable: true }));
    expect(onClose).toHaveBeenCalledTimes(2);

    await userEvent.click(dialog);
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it("devolve o foco a quem abriu ao fechar", () => {
    function Abridor({ aberto }: { aberto: boolean }) {
      return (
        <>
          <button type="button">Abrir</button>
          <BottomSheet open={aberto} title="Folha" onClose={vi.fn()}>
            <p>Conteúdo</p>
          </BottomSheet>
        </>
      );
    }
    const { rerender } = renderWithTheme(<Abridor aberto={false} />);
    screen.getByRole("button", { name: "Abrir" }).focus();
    rerender(<Abridor aberto />);
    expect(screen.getByRole("button", { name: "Fechar" })).toHaveFocus();
    rerender(<Abridor aberto={false} />);
    expect(screen.getByRole("button", { name: "Abrir" })).toHaveFocus();
  });
});
