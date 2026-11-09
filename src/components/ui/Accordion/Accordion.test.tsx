import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";
import { Accordion, AccordionItem, AccordionItemProps } from "./Accordion";

function setup(props: Partial<AccordionItemProps> = {}) {
  const onOpenChange = vi.fn();
  renderWithTheme(
    <Accordion>
      <AccordionItem title="Cobrança" open={false} onOpenChange={onOpenChange} {...props}>
        <p>Conteúdo</p>
      </AccordionItem>
    </Accordion>,
  );
  return onOpenChange;
}

describe("AccordionItem", () => {
  it("abre e fecha pelo cabeçalho, mantendo o painel montado", async () => {
    const onOpenChange = setup({ summary: "R$ 5,00" });
    const trigger = screen.getByRole("button", { name: /Cobrança/ });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText("R$ 5,00")).toBeInTheDocument();
    expect(screen.getByText("Conteúdo")).not.toBeVisible();
    await userEvent.click(trigger);
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it("sem marca nem etiqueta não mostra nenhum dos dois", () => {
    setup();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.queryByText("Alterado")).not.toBeInTheDocument();
  });

  it.each([
    ["pronta", "Seção pronta", "✓"],
    ["pendente", "Seção com pendência", "!"],
    ["erro", "Seção com erro", "!"],
  ] as const)("mostra a marca %s com nome acessível", (marca, nome, simbolo) => {
    setup({ marca });
    expect(screen.getByRole("img", { name: nome })).toHaveTextContent(simbolo);
  });

  it("mostra o número da seção como marca", () => {
    setup({ marca: 2 });
    expect(screen.getByRole("img", { name: "Seção 2" })).toHaveTextContent("2");
  });

  it("mostra a etiqueta ao lado do título", () => {
    setup({ etiqueta: "Alterado" });
    expect(screen.getByText("Alterado")).toBeInTheDocument();
  });

  it("aceita um elemento como resumo", () => {
    setup({ summary: <span data-testid="resumo">antes → depois</span> });
    expect(screen.getByTestId("resumo")).toHaveTextContent("antes → depois");
  });

  it("com erro troca o resumo pelo aviso", () => {
    setup({ summary: "R$ 5,00", hasError: true });
    expect(screen.getByText("Há campos para corrigir")).toBeInTheDocument();
    expect(screen.queryByText("R$ 5,00")).not.toBeInTheDocument();
  });
});
