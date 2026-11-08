import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";
import { ObservacaoFatura } from "./ObservacaoFatura";

const CURTA = "fechamento de outubro";
const LONGA = `${"fechamento de outubro com ajustes combinados ".repeat(4)}fim`;

function celular(ativo: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({ matches: ativo, media: query, addEventListener: () => {}, removeEventListener: () => {} })),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ObservacaoFatura", () => {
  it("sem observação não renderiza nada", () => {
    celular(true);
    const { container } = renderWithTheme(<ObservacaoFatura observacao={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("observação curta aparece inteira, sem botão", () => {
    celular(true);
    renderWithTheme(<ObservacaoFatura observacao={CURTA} />);
    expect(screen.getByText(`Obs.: ${CURTA}`)).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("no celular, observação longa vem limitada e o botão alterna Ver mais e Ver menos", async () => {
    celular(true);
    renderWithTheme(<ObservacaoFatura observacao={LONGA} />);

    const texto = screen.getByText(`Obs.: ${LONGA}`);
    expect(texto).toHaveStyle({ overflow: "hidden" });
    const botao = screen.getByRole("button", { name: "Ver mais" });
    expect(botao).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(botao);
    expect(screen.getByRole("button", { name: "Ver menos" })).toHaveAttribute("aria-expanded", "true");
    expect(texto).not.toHaveStyle({ overflow: "hidden" });

    await userEvent.click(screen.getByRole("button", { name: "Ver menos" }));
    expect(screen.getByRole("button", { name: "Ver mais" })).toBeInTheDocument();
  });

  it("em tela larga a observação longa aparece inteira, sem botão", () => {
    celular(false);
    renderWithTheme(<ObservacaoFatura observacao={LONGA} />);
    expect(screen.getByText(`Obs.: ${LONGA}`)).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
