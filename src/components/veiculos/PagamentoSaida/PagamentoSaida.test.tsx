import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/render";
import { CATEGORIA_VEICULO } from "@/types/veiculo";
import type { SaidaConsulta } from "@/types/saida";
import { FORMA_DINHEIRO, FORMAS_SAIDA } from "../saida";
import { PagamentoSaida, type PagamentoSaidaProps } from "./PagamentoSaida";

const consulta = {
  patioId: 1,
  placa: "BRA2E19",
  categoria: CATEGORIA_VEICULO.CarroMedio,
  valor: 12.5,
} as SaidaConsulta;

const forma = (label: string) => FORMAS_SAIDA.find((item) => item.label === label)!.value;

function renderPagamento(props: Partial<PagamentoSaidaProps> = {}) {
  const handlers = { onFormaChange: vi.fn(), onRecebidoChange: vi.fn(), onEnter: vi.fn() };
  renderWithTheme(<PagamentoSaida consulta={consulta} forma={FORMA_DINHEIRO} recebido="" {...handlers} {...props} />);
  return handlers;
}

describe("PagamentoSaida", () => {
  it("oferece Dinheiro, Crédito, Débito e Pix, com a forma atual marcada", () => {
    renderPagamento();
    expect(screen.getByRole("group", { name: "Forma de pagamento" })).toBeInTheDocument();
    expect(screen.getAllByRole("radio").map((radio) => radio.closest("label")?.textContent)).toEqual([
      "Dinheiro",
      "Crédito",
      "Débito",
      "Pix",
    ]);
    expect(screen.getByRole("radio", { name: "Dinheiro" })).toBeChecked();
  });

  it("troca a forma de pagamento", () => {
    const { onFormaChange } = renderPagamento();
    fireEvent.click(screen.getByRole("radio", { name: "Pix" }));
    expect(onFormaChange).toHaveBeenCalledWith(forma("Pix"));
  });

  it("em Dinheiro pede o valor recebido e orienta enquanto vazio", () => {
    renderPagamento();
    expect(screen.getByLabelText("Valor recebido")).toBeEnabled();
    expect(screen.getByText("Informe o valor recebido.")).toBeInTheDocument();
  });

  it("mostra quanto falta quando o recebido é menor", () => {
    renderPagamento({ recebido: "10,00" });
    expect(screen.getByText(/^Faltam R\$\s2,50\.$/)).toBeInTheDocument();
  });

  it("mostra o troco quando o recebido cobre o valor", () => {
    renderPagamento({ recebido: "20,00" });
    expect(screen.getByText(/^Troco: R\$\s7,50$/)).toBeInTheDocument();
  });

  it.each(["Crédito", "Débito", "Pix"])("em %s não há valor recebido nem troco", (label) => {
    renderPagamento({ forma: forma(label) });
    expect(screen.queryByLabelText("Valor recebido")).not.toBeInTheDocument();
    expect(screen.queryByText(/Troco|Faltam|Informe o valor/)).not.toBeInTheDocument();
  });

  it("envia o valor digitado e pede a confirmação com Enter, sem tirar o foco do campo atual", async () => {
    const { onRecebidoChange, onEnter } = renderPagamento();
    const campo = screen.getByLabelText("Valor recebido");
    expect(campo).not.toHaveFocus();
    await userEvent.type(campo, "5{Enter}");
    expect(onRecebidoChange).toHaveBeenCalledWith("5");
    expect(onEnter).toHaveBeenCalledTimes(1);
  });

  it("sem veículo o pagamento fica visível, porém inativo e sem troco", () => {
    renderPagamento({ consulta: null });
    expect(screen.getByRole("radio", { name: "Pix" })).toBeDisabled();
    expect(screen.getByLabelText("Valor recebido")).toBeDisabled();
    expect(screen.queryByText(/Troco|Faltam|Informe o valor/)).not.toBeInTheDocument();
  });

  it("trava tudo durante o envio", () => {
    renderPagamento({ disabled: true });
    expect(screen.getByRole("radio", { name: "Crédito" })).toBeDisabled();
    expect(screen.getByLabelText("Valor recebido")).toBeDisabled();
  });
});
