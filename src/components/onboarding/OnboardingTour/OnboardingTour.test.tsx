import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";
import type { Passo } from "../passos";
import { OnboardingTour } from "./OnboardingTour";

const PASSOS: Passo[] = [
  { id: "boas-vindas", titulo: "Bem-vindo ao Murel", texto: "Vamos começar." },
  { id: "/patio", titulo: "Pátio", texto: "Veículos no pátio.", icone: "yard", onde: "No menu, em Operação." },
  { id: "/caixa", titulo: "Caixa", texto: "Caixa do turno.", icone: "cashier", onde: "No menu, em Financeiro." },
  { id: "pronto", titulo: "Tudo certo", texto: "Pode começar." },
];

const onSair = vi.fn();
const onNaoMostrarMais = vi.fn();
const onConcluir = vi.fn();

function abrir(props: Partial<React.ComponentProps<typeof OnboardingTour>> = {}) {
  return renderWithTheme(
    <OnboardingTour passos={PASSOS} modo="primeiro-acesso" onSair={onSair} onNaoMostrarMais={onNaoMostrarMais} onConcluir={onConcluir} {...props} />,
  );
}

describe("OnboardingTour", () => {
  beforeEach(() => vi.clearAllMocks());

  it("abre nas boas-vindas, com progresso, sem Voltar e com Avançar", () => {
    abrir();

    expect(screen.getByRole("dialog", { name: "Tour de boas-vindas" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Bem-vindo ao Murel" })).toBeInTheDocument();
    expect(screen.getByText("Passo 1 de 4")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Progresso do tour" })).toHaveAttribute("aria-valuenow", "1");
    expect(screen.queryByRole("button", { name: "Voltar" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Avançar" })).toBeInTheDocument();
  });

  it("avança e volta entre os passos, mostrando o módulo, a posição e onde encontrar", async () => {
    const user = userEvent.setup();
    abrir();

    await user.click(screen.getByRole("button", { name: "Avançar" }));
    expect(screen.getByRole("heading", { name: "Pátio" })).toBeInTheDocument();
    expect(screen.getByText("Módulo 1 de 2")).toBeInTheDocument();
    expect(screen.getByText("No menu, em Operação.")).toBeInTheDocument();
    expect(screen.getByText("Passo 2 de 4")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Avançar" }));
    expect(screen.getByText("Módulo 2 de 2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Voltar" }));
    expect(screen.getByRole("heading", { name: "Pátio" })).toBeInTheDocument();
  });

  it("no último passo, Avançar vira Concluir e conclui", async () => {
    const user = userEvent.setup();
    abrir();

    for (let i = 0; i < PASSOS.length - 1; i++) await user.click(screen.getByRole("button", { name: "Avançar" }));
    expect(screen.getByRole("heading", { name: "Tudo certo" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Avançar" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Concluir" }));
    expect(onConcluir).toHaveBeenCalledTimes(1);
  });

  it("as setas navegam", () => {
    abrir();
    const avancar = screen.getByRole("button", { name: "Avançar" });

    fireEvent.keyDown(avancar, { key: "ArrowRight" });
    expect(screen.getByRole("heading", { name: "Pátio" })).toBeInTheDocument();
    fireEvent.keyDown(avancar, { key: "ArrowLeft" });
    expect(screen.getByRole("heading", { name: "Bem-vindo ao Murel" })).toBeInTheDocument();
  });

  it("Sair, o × e o Esc só saem, sem registrar", async () => {
    const user = userEvent.setup();
    abrir();

    await user.click(screen.getByRole("button", { name: "Sair" }));
    await user.click(screen.getByRole("button", { name: "Fechar" }));
    fireEvent.keyDown(document, { key: "Escape" });

    expect(onSair).toHaveBeenCalledTimes(3);
    expect(onNaoMostrarMais).not.toHaveBeenCalled();
    expect(onConcluir).not.toHaveBeenCalled();
  });

  it("Não mostrar mais aparece no primeiro acesso, em qualquer passo, e chama a ação", async () => {
    const user = userEvent.setup();
    abrir();
    await user.click(screen.getByRole("button", { name: "Avançar" }));

    await user.click(screen.getByRole("button", { name: "Não mostrar mais" }));

    expect(onNaoMostrarMais).toHaveBeenCalledTimes(1);
  });

  it("ao repetir o tour, Não mostrar mais não existe", () => {
    abrir({ modo: "repeticao" });

    expect(screen.queryByRole("button", { name: "Não mostrar mais" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sair" })).toBeInTheDocument();
  });

  it("enquanto registra, trava os botões e o Esc", () => {
    abrir({ registrando: true });

    expect(screen.getByRole("button", { name: "Salvando..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Sair" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Não mostrar mais" })).toBeDisabled();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onSair).not.toHaveBeenCalled();
  });

  describe("destaque no menu", () => {
    function montarMenu() {
      const link = document.createElement("a");
      link.href = "#patio";
      link.dataset.tourId = "/patio";
      link.getBoundingClientRect = () => ({ top: 100, left: 0, width: 72, height: 34, right: 72, bottom: 134, x: 0, y: 100, toJSON: () => ({}) });
      document.body.appendChild(link);
      return link;
    }

    afterEach(() => {
      document.querySelectorAll("[data-tour-id]").forEach((el) => el.remove());
    });

    it("destaca o item do menu do passo e ensina a abri-lo", async () => {
      montarMenu();
      const user = userEvent.setup();
      abrir();
      await user.click(screen.getByRole("button", { name: "Avançar" }));

      expect(await screen.findByText(/Toque no item destacado para abrir Pátio/)).toBeInTheDocument();
      expect(screen.queryByText("No menu, em Operação.")).not.toBeInTheDocument();
    });

    it("abrir o item destacado avança o tour", async () => {
      const link = montarMenu();
      const user = userEvent.setup();
      abrir();
      await user.click(screen.getByRole("button", { name: "Avançar" }));
      await screen.findByText(/Toque no item destacado/);

      link.click();

      expect(await screen.findByRole("heading", { name: "Caixa" })).toBeInTheDocument();
    });
  });
});
