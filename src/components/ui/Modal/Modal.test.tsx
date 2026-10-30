import { screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";
import { Modal } from "./Modal";

// jsdom não implementa <dialog>; como o navegador, showModal foca o primeiro controle (o "×").
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
    this.querySelector<HTMLElement>("button")?.focus();
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

describe("Modal", () => {
  it("sem data-autofocus o foco fica no primeiro controle", () => {
    renderWithTheme(
      <Modal open title="Teste" onClose={vi.fn()}>
        <input aria-label="Campo" />
      </Modal>,
    );
    expect(screen.getByRole("button", { name: "Fechar" })).toHaveFocus();
  });

  it("o campo marcado com data-autofocus recebe o foco depois de abrir", () => {
    renderWithTheme(
      <Modal open title="Teste" onClose={vi.fn()}>
        <input aria-label="Campo" data-autofocus="" />
      </Modal>,
    );
    expect(screen.getByLabelText("Campo")).toHaveFocus();
  });
});
