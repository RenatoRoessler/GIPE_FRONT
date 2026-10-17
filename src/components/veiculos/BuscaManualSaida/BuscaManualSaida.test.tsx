import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { SaidaBuscaValues } from "@/lib/schemas/saida";
import { renderWithTheme } from "@/test/render";
import { BuscaManualSaida, SEQUENCIAL_ENTER_HINT, type BuscaManualSaidaProps } from "./BuscaManualSaida";

const VAZIO: SaidaBuscaValues = { placa: "", token: "", sequencial: "" };

function renderBusca(props: Partial<BuscaManualSaidaProps> = {}) {
  const onChange = vi.fn();
  const onEnter = vi.fn();
  renderWithTheme(<BuscaManualSaida values={VAZIO} errors={{}} onChange={onChange} onEnter={onEnter} {...props} />);
  return { onChange, onEnter };
}

const placa = () => screen.getByLabelText("Placa");
const token = () => screen.getByLabelText("Token");
const sequencial = () => screen.getByLabelText("Sequencial");

describe("BuscaManualSaida", () => {
  it("mostra os três campos habilitados quando nenhum está preenchido", () => {
    renderBusca();
    expect(placa()).toBeEnabled();
    expect(token()).toBeEnabled();
    expect(sequencial()).toBeEnabled();
    expect(screen.getByText("ou informe sem QR Code")).toBeInTheDocument();
  });

  it("desabilita os outros dois campos quando um está preenchido", () => {
    renderBusca({ values: { ...VAZIO, token: "7K3Q9X" } });
    expect(token()).toBeEnabled();
    expect(placa()).toBeDisabled();
    expect(sequencial()).toBeDisabled();
    expect(screen.getAllByText("Limpe o campo token para usar outro.")).toHaveLength(2);
  });

  it("libera os campos quando o preenchido é limpo", () => {
    const { rerender } = renderWithTheme(<BuscaManualSaida values={{ ...VAZIO, sequencial: "7" }} errors={{}} onChange={() => {}} />);
    expect(placa()).toBeDisabled();
    rerender(<BuscaManualSaida values={VAZIO} errors={{}} onChange={() => {}} />);
    expect(placa()).toBeEnabled();
  });

  it("normaliza a placa digitada", () => {
    const { onChange } = renderBusca();
    fireEvent.change(placa(), { target: { value: "bra-2e19x" } });
    expect(onChange).toHaveBeenCalledWith("placa", "BRA2E19");
  });

  it("aceita o token como texto livre", () => {
    const { onChange } = renderBusca();
    fireEvent.change(token(), { target: { value: "7k3Q9x" } });
    expect(onChange).toHaveBeenCalledWith("token", "7k3Q9x");
  });

  it("aceita só números no sequencial", () => {
    const { onChange } = renderBusca();
    fireEvent.change(sequencial(), { target: { value: "x7" } });
    expect(onChange).toHaveBeenCalledWith("sequencial", "7");
  });

  it("pede a consulta com Enter", async () => {
    const { onEnter } = renderBusca();
    await userEvent.type(placa(), "{Enter}");
    expect(onEnter).toHaveBeenCalledTimes(1);
  });

  it("mostra o erro do campo e o aviso da consulta", () => {
    renderBusca({
      values: { ...VAZIO, placa: "ABC12" },
      errors: { placa: "Placa inválida. Informe no padrão antigo (ABC1234) ou Mercosul (ABC1D23)" },
      aviso: "Nenhum ticket aberto para esta placa.",
    });
    expect(screen.getByText(/^Placa inválida/)).toBeInTheDocument();
    expect(screen.getByText("Nenhum ticket aberto para esta placa.")).toBeInTheDocument();
  });

  it("desabilita tudo com disabled", () => {
    renderBusca({ disabled: true });
    expect(placa()).toBeDisabled();
    expect(token()).toBeDisabled();
    expect(sequencial()).toBeDisabled();
  });

  it("orienta a buscar o sequencial com Enter e pede a tecla de busca no teclado", () => {
    renderBusca();
    expect(sequencial()).toHaveAccessibleDescription(SEQUENCIAL_ENTER_HINT);
    expect(sequencial()).toHaveAttribute("enterkeyhint", "search");
  });

  it("não repete a dica de Enter em placa e token", () => {
    renderBusca();
    expect(placa()).not.toHaveAccessibleDescription(SEQUENCIAL_ENTER_HINT);
    expect(token()).not.toHaveAccessibleDescription(SEQUENCIAL_ENTER_HINT);
    expect(screen.getAllByText(SEQUENCIAL_ENTER_HINT)).toHaveLength(1);
  });

  it("com outro campo preenchido, o sequencial mostra o motivo do bloqueio em vez da dica", () => {
    renderBusca({ values: { ...VAZIO, token: "7K3Q9X" } });
    expect(sequencial()).toBeDisabled();
    expect(screen.queryByText(SEQUENCIAL_ENTER_HINT)).not.toBeInTheDocument();
    expect(sequencial()).toHaveAccessibleDescription("Limpe o campo token para usar outro.");
  });

  it("com erro no sequencial mostra o erro e não a dica", () => {
    renderBusca({ values: { ...VAZIO, sequencial: "12" }, errors: { sequencial: "Use apenas números" } });
    expect(screen.getByText("Use apenas números")).toBeInTheDocument();
    expect(screen.queryByText(SEQUENCIAL_ENTER_HINT)).not.toBeInTheDocument();
  });
});
