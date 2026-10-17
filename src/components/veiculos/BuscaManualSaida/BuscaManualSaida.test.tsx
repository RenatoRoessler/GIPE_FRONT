import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { SaidaBuscaValues } from "@/lib/schemas/saida";
import { renderWithTheme } from "@/test/render";
import { BUSCA_QR_ATIVA_HINT, BuscaManualSaida, type BuscaManualSaidaProps } from "./BuscaManualSaida";

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

  it("bloqueia os três campos durante a leitura por QR e explica o motivo", () => {
    renderBusca({ bloqueadoPorQr: true, values: { placa: "BRA2E19", token: "7K3Q9X", sequencial: "" } });
    expect(placa()).toBeDisabled();
    expect(token()).toBeDisabled();
    expect(sequencial()).toBeDisabled();
    expect(screen.getByText(BUSCA_QR_ATIVA_HINT)).toBeInTheDocument();
    expect(placa()).toHaveValue("BRA2E19");
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
});
