import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MEDIA_TOQUE } from "@/components/teclado/useTecladoCampo";
import type { SaidaBuscaValues } from "@/lib/schemas/saida";
import { renderWithTheme } from "@/test/render";
import { BuscaManualSaida, SEQUENCIAL_ENTER_HINT, type BuscaManualSaidaProps } from "./BuscaManualSaida";

// O leitor em si é testado à parte: aqui ele só devolve uma placa lida.
vi.mock("../LeitorPlacaModal", () => ({
  LeitorPlacaModal: ({ open, onConfirm, onDigitar }: { open: boolean; onConfirm: (placa: string) => void; onDigitar: () => void }) =>
    open ? (
      <div role="dialog" aria-label="Leitor de placa">
        <button type="button" onClick={() => onConfirm("ABC1D23")}>
          confirmar leitura
        </button>
        <button type="button" onClick={onDigitar}>
          digitar leitura
        </button>
      </div>
    ) : null,
}));

const VAZIO: SaidaBuscaValues = { placa: "", token: "", sequencial: "" };

function renderBusca(props: Partial<BuscaManualSaidaProps> = {}) {
  const onChange = vi.fn();
  const onEnter = vi.fn();
  renderWithTheme(<BuscaManualSaida values={VAZIO} errors={{}} onChange={onChange} onEnter={onEnter} {...props} />);
  return { onChange, onEnter };
}

const placa = () => screen.getByLabelText("Placa do veículo");
const token = () => screen.getByLabelText("Token do cupom");
const sequencial = () => screen.getByLabelText("Sequencial do veículo");
const escolher = (nome: "Placa" | "Token" | "Sequencial") => userEvent.click(screen.getByRole("radio", { name: nome }));

function stubToque() {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query === MEDIA_TOQUE,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("BuscaManualSaida", () => {
  it("abre com a placa escolhida e só o campo dela na tela", () => {
    renderBusca();
    expect(screen.getByRole("group", { name: "Buscar por" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Placa" })).toBeChecked();
    expect(placa()).toBeEnabled();
    expect(screen.queryByLabelText("Token do cupom")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Sequencial do veículo")).not.toBeInTheDocument();
    expect(screen.getByText("ou informe sem QR Code")).toBeInTheDocument();
  });

  it("abre no campo que já tem valor", () => {
    renderBusca({ values: { ...VAZIO, sequencial: "12" } });
    expect(screen.getByRole("radio", { name: "Sequencial" })).toBeChecked();
    expect(sequencial()).toHaveValue("12");
  });

  it("trocar a opção mostra o outro campo, com foco, e limpa o valor do anterior", async () => {
    const { onChange } = renderBusca({ values: { ...VAZIO, placa: "ABC1D23" } });
    await escolher("Token");
    expect(onChange).toHaveBeenCalledWith("placa", "");
    expect(token()).toBeEnabled();
    expect(screen.queryByLabelText("Placa do veículo")).not.toBeInTheDocument();
    await waitFor(() => expect(token()).toHaveFocus());
  });

  it("trocar a opção com o campo vazio não limpa nada", async () => {
    const { onChange } = renderBusca();
    await escolher("Sequencial");
    expect(onChange).not.toHaveBeenCalled();
    expect(sequencial()).toBeInTheDocument();
  });

  it("no celular o campo escolhido usa o teclado do Murel, não o do sistema", async () => {
    stubToque();
    renderBusca();
    expect(placa()).toHaveAttribute("inputmode", "none");
    await escolher("Token");
    expect(token()).toHaveAttribute("inputmode", "none");
    await escolher("Sequencial");
    expect(sequencial()).toHaveAttribute("inputmode", "none");
  });

  it("no computador o sequencial mantém o teclado numérico do sistema", async () => {
    renderBusca();
    await escolher("Sequencial");
    expect(sequencial()).toHaveAttribute("inputmode", "numeric");
  });

  it("normaliza a placa digitada", () => {
    const { onChange } = renderBusca();
    fireEvent.change(placa(), { target: { value: "bra-2e19x" } });
    expect(onChange).toHaveBeenCalledWith("placa", "BRA2E19");
  });

  it("aceita o token como texto livre", async () => {
    const { onChange } = renderBusca();
    await escolher("Token");
    fireEvent.change(token(), { target: { value: "7k3Q9x" } });
    expect(onChange).toHaveBeenCalledWith("token", "7k3Q9x");
  });

  it("aceita só números no sequencial", async () => {
    const { onChange } = renderBusca();
    await escolher("Sequencial");
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

  it("desabilita as opções e o campo com disabled", () => {
    renderBusca({ disabled: true });
    expect(placa()).toBeDisabled();
    expect(screen.getByRole("radio", { name: "Token" })).toBeDisabled();
  });

  it("orienta a buscar o sequencial com Enter e pede a tecla de busca no teclado", async () => {
    renderBusca();
    await escolher("Sequencial");
    expect(sequencial()).toHaveAccessibleDescription(SEQUENCIAL_ENTER_HINT);
    expect(sequencial()).toHaveAttribute("enterkeyhint", "search");
  });

  it("não mostra a dica de Enter em placa e token", async () => {
    renderBusca();
    expect(placa()).not.toHaveAccessibleDescription(SEQUENCIAL_ENTER_HINT);
    await escolher("Token");
    expect(token()).not.toHaveAccessibleDescription(SEQUENCIAL_ENTER_HINT);
  });

  it("com erro no sequencial mostra o erro e não a dica", () => {
    renderBusca({ values: { ...VAZIO, sequencial: "12" }, errors: { sequencial: "Use apenas números" } });
    expect(screen.getByText("Use apenas números")).toBeInTheDocument();
    expect(screen.queryByText(SEQUENCIAL_ENTER_HINT)).not.toBeInTheDocument();
  });

  describe("leitor de placa", () => {
    const camera = () => screen.getByRole("button", { name: "Ler placa pela câmera" });

    it("mostra a câmera só quando a opção é a placa", async () => {
      renderBusca();
      expect(camera()).toBeInTheDocument();
      await escolher("Token");
      expect(screen.queryByRole("button", { name: "Ler placa pela câmera" })).not.toBeInTheDocument();
    });

    it("preenche a placa lida sem disparar a consulta", async () => {
      const { onChange, onEnter } = renderBusca();
      await userEvent.click(camera());
      await userEvent.click(screen.getByRole("button", { name: "confirmar leitura" }));
      expect(onChange).toHaveBeenCalledWith("placa", "ABC1D23");
      expect(onEnter).not.toHaveBeenCalled();
      expect(screen.queryByRole("dialog", { name: "Leitor de placa" })).not.toBeInTheDocument();
    });

    it("devolve o foco ao campo da placa ao escolher digitar", async () => {
      renderBusca();
      await userEvent.click(camera());
      await userEvent.click(screen.getByRole("button", { name: "digitar leitura" }));
      await waitFor(() => expect(placa()).toHaveFocus());
    });

    it("desabilita a câmera com disabled", () => {
      renderWithTheme(<BuscaManualSaida values={VAZIO} errors={{}} onChange={() => {}} disabled />);
      expect(camera()).toBeDisabled();
    });

    it("mantém a câmera habilitada quando a própria placa está preenchida", () => {
      renderBusca({ values: { ...VAZIO, placa: "ABC1D23" } });
      expect(camera()).toBeEnabled();
    });
  });
});
