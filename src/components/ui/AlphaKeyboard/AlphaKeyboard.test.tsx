import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";
import { AlphaKeyboard, AlphaKeyboardProps } from "./AlphaKeyboard";

function props(extras: Partial<AlphaKeyboardProps> = {}): AlphaKeyboardProps {
  return { valor: "", rotuloAcao: "Próximo", onChar: vi.fn(), onApagar: vi.fn(), onAcao: vi.fn(), ...extras };
}

const botao = (nome: string) => screen.getByRole("button", { name: nome });
const temBotao = (nome: string) => screen.queryByRole("button", { name: nome }) !== null;

describe("AlphaKeyboard", () => {
  it("começa em letras, com 123, espaço e Próximo na última linha", () => {
    renderWithTheme(<AlphaKeyboard {...props({ valor: "GOL" })} />);

    expect(temBotao("Q")).toBe(true);
    expect(temBotao("Mostrar números")).toBe(true);
    expect(temBotao("Espaço")).toBe(true);
    expect(botao("Próximo campo")).toHaveTextContent("Próximo");
    expect(screen.getByRole("group", { name: "Teclado de letras e números" })).toBeInTheDocument();
  });

  it("insere letras e apaga", () => {
    const p = props({ valor: "GO" });
    renderWithTheme(<AlphaKeyboard {...p} />);

    fireEvent.click(botao("L"));
    fireEvent.click(botao("Apagar"));

    expect(p.onChar).toHaveBeenCalledWith("L");
    expect(p.onApagar).toHaveBeenCalledTimes(1);
  });

  it("alterna entre letras e números", () => {
    renderWithTheme(<AlphaKeyboard {...props({ valor: "GOL" })} />);

    fireEvent.click(botao("Mostrar números"));
    expect(temBotao("Q")).toBe(false);
    expect(botao("5")).toBeEnabled();
    expect(temBotao("Mostrar letras")).toBe(true);
    expect(temBotao("Espaço")).toBe(true);

    fireEvent.click(botao("Mostrar letras"));
    expect(temBotao("Q")).toBe(true);
  });

  it("volta ao modo letras quando o campo (chave) muda", () => {
    const { rerender } = renderWithTheme(<AlphaKeyboard {...props({ chave: "modelo" })} />);
    fireEvent.click(botao("Mostrar números"));
    expect(temBotao("Q")).toBe(false);

    rerender(<AlphaKeyboard {...props({ chave: "observacao" })} />);

    expect(temBotao("Q")).toBe(true);
  });

  it("desabilita o espaço com o campo vazio ou terminado em espaço", () => {
    const { rerender } = renderWithTheme(<AlphaKeyboard {...props({ valor: "" })} />);
    expect(botao("Espaço")).toBeDisabled();

    rerender(<AlphaKeyboard {...props({ valor: "GOL " })} />);
    expect(botao("Espaço")).toBeDisabled();

    rerender(<AlphaKeyboard {...props({ valor: "GOL" })} />);
    expect(botao("Espaço")).toBeEnabled();
  });

  it("insere o espaço pelo onChar", () => {
    const p = props({ valor: "GOL" });
    renderWithTheme(<AlphaKeyboard {...p} />);

    fireEvent.click(botao("Espaço"));

    expect(p.onChar).toHaveBeenCalledWith(" ");
  });

  it("desabilita as teclas de caractere no limite e mantém apagar e ação", () => {
    renderWithTheme(<AlphaKeyboard {...props({ valor: "GOL", maxLength: 3 })} />);

    expect(botao("A")).toBeDisabled();
    expect(botao("Apagar")).toBeEnabled();
    expect(botao("Próximo campo")).toBeEnabled();
  });

  it("usa o rótulo OK no último campo", () => {
    renderWithTheme(<AlphaKeyboard {...props({ rotuloAcao: "OK" })} />);

    expect(botao("Concluir")).toHaveTextContent("OK");
  });

  it("no modo números mostra o rótulo da ação e aciona o onAcao", () => {
    const p = props({ valor: "GOL", rotuloAcao: "OK" });
    renderWithTheme(<AlphaKeyboard {...p} />);

    fireEvent.click(botao("Mostrar números"));
    fireEvent.click(botao("Concluir"));

    expect(p.onAcao).toHaveBeenCalledTimes(1);
  });
});
