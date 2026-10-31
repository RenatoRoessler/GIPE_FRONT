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

const placa = () => screen.getByLabelText("Placa");
const token = () => screen.getByLabelText("Token");
const sequencial = () => screen.getByLabelText("Sequencial");

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("BuscaManualSaida", () => {
  it("no celular os três campos usam o teclado do Murel, não o do sistema", () => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query === MEDIA_TOQUE,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
    renderBusca();

    expect(placa()).toHaveAttribute("inputmode", "none");
    expect(token()).toHaveAttribute("inputmode", "none");
    expect(sequencial()).toHaveAttribute("inputmode", "none");
  });

  it("no computador o sequencial mantém o teclado numérico do sistema", () => {
    renderBusca();

    expect(sequencial()).toHaveAttribute("inputmode", "numeric");
  });

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

  describe("leitor de placa", () => {
    const camera = () => screen.getByRole("button", { name: "Ler placa pela câmera" });

    it("mostra a câmera só no campo da placa", () => {
      renderBusca();
      expect(screen.getAllByRole("button", { name: "Ler placa pela câmera" })).toHaveLength(1);
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

    it("desabilita a câmera com disabled ou quando outro campo está preenchido", () => {
      const { unmount } = renderWithTheme(
        <BuscaManualSaida values={VAZIO} errors={{}} onChange={() => {}} disabled />,
      );
      expect(camera()).toBeDisabled();
      unmount();

      renderWithTheme(<BuscaManualSaida values={{ ...VAZIO, token: "7K3Q9X" }} errors={{}} onChange={() => {}} />);
      expect(camera()).toBeDisabled();
    });

    it("mantém a câmera habilitada quando a própria placa está preenchida", () => {
      renderBusca({ values: { ...VAZIO, placa: "ABC1D23" } });
      expect(camera()).toBeEnabled();
    });
  });
});
