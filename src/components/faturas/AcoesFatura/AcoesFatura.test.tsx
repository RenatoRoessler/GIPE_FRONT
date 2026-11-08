import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";
import { SITUACAO_FATURA } from "@/types/fatura";
import { AcoesFatura } from "./AcoesFatura";

function renderizar(situacao: number, lugar: "heroi" | "barra" = "heroi") {
  const onPagar = vi.fn();
  const onCancelar = vi.fn();
  const { container } = renderWithTheme(<AcoesFatura fatura={{ situacao }} lugar={lugar} onPagar={onPagar} onCancelar={onCancelar} />);
  return { onPagar, onCancelar, container };
}

describe("AcoesFatura", () => {
  it("fatura aberta oferece registrar pagamento e cancelar", async () => {
    const { onPagar, onCancelar } = renderizar(SITUACAO_FATURA.Aberta);

    await userEvent.click(screen.getByRole("button", { name: "Registrar pagamento" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancelar fatura" }));
    expect(onPagar).toHaveBeenCalledTimes(1);
    expect(onCancelar).toHaveBeenCalledTimes(1);
  });

  it("no herói o pagamento vem primeiro; na barra o cancelamento fica à esquerda", () => {
    renderizar(SITUACAO_FATURA.Aberta, "heroi");
    expect(screen.getAllByRole("button").map((botao) => botao.textContent)).toEqual(["Registrar pagamento", "Cancelar fatura"]);
  });

  it("na barra o cancelamento vem antes do pagamento", () => {
    renderizar(SITUACAO_FATURA.Aberta, "barra");
    expect(screen.getAllByRole("button").map((botao) => botao.textContent)).toEqual(["Cancelar fatura", "Registrar pagamento"]);
  });

  it("fatura paga não renderiza nada", () => {
    const { container } = renderizar(SITUACAO_FATURA.Paga);
    expect(container).toBeEmptyDOMElement();
  });

  it("fatura cancelada não renderiza nada, nem na barra", () => {
    const { container } = renderizar(SITUACAO_FATURA.Cancelada, "barra");
    expect(container).toBeEmptyDOMElement();
  });
});
