import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";
import { PainelCadastro, type SecaoPainel } from "./PainelCadastro";

const SECOES: SecaoPainel[] = [
  { id: "a", titulo: "Empresa", estado: "pronta" },
  { id: "b", titulo: "Responsável", estado: "erro" },
  { id: "c", titulo: "Pagamentos", estado: "pendente" },
];

// A lista de seções só aparece em telas grandes; no jsdom (tela estreita) fica oculta, daí o `hidden: true`.
describe("PainelCadastro", () => {
  it("conta as seções prontas e diz o estado de cada uma em texto", () => {
    renderWithTheme(
      <PainelCadastro secoes={SECOES} onSelect={() => {}}>
        <button type="button">Salvar</button>
      </PainelCadastro>,
    );

    expect(screen.getByText("1 de 3 seções prontas")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Empresa\s*Pronta/, hidden: true })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^Responsável\s*Há campos para corrigir/, hidden: true }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Pagamentos\s*Falta preencher/, hidden: true })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salvar" })).toBeInTheDocument();
  });

  it("o status informado substitui a contagem", () => {
    renderWithTheme(
      <PainelCadastro secoes={SECOES} onSelect={() => {}} status="Tudo salvo">
        <button type="button">Salvar</button>
      </PainelCadastro>,
    );

    expect(screen.getByText("Tudo salvo")).toBeInTheDocument();
    expect(screen.queryByText(/seções prontas/)).not.toBeInTheDocument();
  });

  it("escolher uma seção avisa com o id dela", async () => {
    const onSelect = vi.fn();
    renderWithTheme(
      <PainelCadastro secoes={SECOES} onSelect={onSelect}>
        <button type="button">Salvar</button>
      </PainelCadastro>,
    );

    await userEvent.click(screen.getByRole("button", { name: /^Responsável/, hidden: true }));

    expect(onSelect).toHaveBeenCalledWith("b");
  });
});
