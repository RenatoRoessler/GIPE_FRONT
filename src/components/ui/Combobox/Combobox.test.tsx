import { act, fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TecladoProvider } from "@/components/teclado/TecladoProvider";
import { MEDIA_TOQUE } from "@/components/teclado/useTecladoCampo";
import { renderWithTheme } from "@/test/render";
import { Combobox, type ComboboxOption, type ComboboxProps } from "./Combobox";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

afterEach(() => {
  vi.unstubAllGlobals();
});

const TODAS: ComboboxOption[] = [
  { id: 1, label: "Civic", destaque: { antes: "", casado: "Ci", depois: "vic" } },
  { id: 2, label: "Cielo" },
  { id: 3, label: "Corolla" },
];

function Harness({
  onSelect,
  onSubmit,
  loading,
  semOpcoes,
  disabled,
  teclado,
}: {
  teclado?: ComboboxProps["teclado"];
  onSelect?: (option: ComboboxOption) => void;
  onSubmit?: () => void;
  loading?: boolean;
  semOpcoes?: boolean;
  disabled?: boolean;
}) {
  const [valor, setValor] = useState("");
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit?.();
      }}
    >
      <Combobox
        label="Modelo"
        value={valor}
        onChange={setValor}
        onSelect={onSelect}
        options={semOpcoes || valor === "" ? [] : TODAS}
        loading={loading}
        disabled={disabled}
        teclado={teclado}
        emptyText="Nenhum modelo encontrado."
      />
    </form>
  );
}

describe("Combobox", () => {
  it("abre a lista ao digitar e mostra as sugestões", async () => {
    const user = userEvent.setup();
    renderWithTheme(<Harness />);
    const campo = screen.getByRole("combobox", { name: "Modelo" });
    expect(campo).toHaveAttribute("aria-expanded", "false");

    await user.type(campo, "c");

    expect(campo).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByRole("option")).toHaveLength(3);
  });

  it("escolhe a sugestão com o clique", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderWithTheme(<Harness onSelect={onSelect} />);
    const campo = screen.getByRole("combobox", { name: "Modelo" });

    await user.type(campo, "c");
    await user.click(screen.getByRole("option", { name: "Corolla" }));

    expect(campo).toHaveValue("Corolla");
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 3 }));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("navega com as setas e escolhe com Enter sem enviar o formulário", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderWithTheme(<Harness onSubmit={onSubmit} />);
    const campo = screen.getByRole("combobox", { name: "Modelo" });

    await user.type(campo, "c");
    await user.keyboard("{ArrowDown}{ArrowDown}");
    expect(campo.getAttribute("aria-activedescendant")).toBe(screen.getByRole("option", { name: "Cielo" }).id);
    await user.keyboard("{Enter}");

    expect(campo).toHaveValue("Cielo");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("volta ao último item com ArrowUp a partir do primeiro", async () => {
    const user = userEvent.setup();
    renderWithTheme(<Harness />);
    const campo = screen.getByRole("combobox", { name: "Modelo" });

    await user.type(campo, "c");
    await user.keyboard("{ArrowDown}{ArrowUp}");

    expect(campo.getAttribute("aria-activedescendant")).toBe(screen.getByRole("option", { name: "Corolla" }).id);
  });

  it("Enter sem item ativo não é interceptado: o formulário envia com o texto digitado", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderWithTheme(<Harness onSubmit={onSubmit} />);
    const campo = screen.getByRole("combobox", { name: "Modelo" });

    await user.type(campo, "Meu carro{Enter}");

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(campo).toHaveValue("Meu carro");
  });

  it("Esc fecha a lista sem alterar o texto", async () => {
    const user = userEvent.setup();
    renderWithTheme(<Harness />);
    const campo = screen.getByRole("combobox", { name: "Modelo" });

    await user.type(campo, "c");
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(campo).toHaveValue("c");
  });

  it("avisa, sem erro, quando nada casa", async () => {
    const user = userEvent.setup();
    renderWithTheme(<Harness semOpcoes />);

    await user.type(screen.getByRole("combobox", { name: "Modelo" }), "xyz");

    expect(screen.getAllByText("Nenhum modelo encontrado.").length).toBeGreaterThan(0);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("indica o carregamento enquanto a lista não chegou, sem bloquear a digitação", async () => {
    const user = userEvent.setup();
    renderWithTheme(<Harness semOpcoes loading />);
    const campo = screen.getByRole("combobox", { name: "Modelo" });

    await user.type(campo, "ci");

    expect(campo).toHaveValue("ci");
    expect(screen.getByText("Carregando modelos…")).toBeInTheDocument();
  });

  it("destaca o trecho digitado na sugestão", async () => {
    const user = userEvent.setup();
    renderWithTheme(<Harness />);

    await user.type(screen.getByRole("combobox", { name: "Modelo" }), "ci");

    expect(screen.getByText("Ci", { selector: "strong" })).toBeInTheDocument();
  });

  it("desabilitado não abre a lista", () => {
    renderWithTheme(<Harness disabled />);
    expect(screen.getByRole("combobox", { name: "Modelo" })).toBeDisabled();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  describe("com o teclado do celular", () => {
    function simularToque() {
      vi.stubGlobal("matchMedia", (query: string) => ({
        matches: query === MEDIA_TOQUE,
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }));
    }

    it("digitar pelas teclas mantém a lista aberta e permite escolher a sugestão", () => {
      simularToque();
      const onSelect = vi.fn();
      renderWithTheme(
        <TecladoProvider>
          <Harness teclado={{ tipo: "alfa" }} onSelect={onSelect} />
        </TecladoProvider>,
      );
      const campo = screen.getByRole("combobox", { name: "Modelo" });
      act(() => campo.focus());

      fireEvent.click(screen.getByRole("button", { name: "C" }));
      fireEvent.click(screen.getByRole("button", { name: "I" }));

      expect(campo).toHaveValue("CI");
      expect(screen.getByRole("listbox")).toBeInTheDocument();
      expect(screen.getByRole("group", { name: "Teclado de letras e números" })).toBeInTheDocument();

      fireEvent.click(screen.getByRole("option", { name: "Civic" }));

      expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ label: "Civic" }));
    });
  });
});
