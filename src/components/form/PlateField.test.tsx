import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TecladoProvider } from "@/components/teclado/TecladoProvider";
import { MEDIA_TOQUE } from "@/components/teclado/useTecladoCampo";
import { renderWithTheme } from "@/test/render";
import { PLACA_INVALIDA_MESSAGE, isValidPlaca } from "@/lib/placa";
import { useAppForm } from "./form";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

function simularToque(ativo: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: ativo && query === MEDIA_TOQUE,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

function Harness({ withAction, inicial = "ABC1D23" }: { withAction: boolean; inicial?: string }) {
  const form = useAppForm({ defaultValues: { placa: inicial } });
  return (
    <TecladoProvider>
      <form.AppField name="placa">
        {(field) => (
          <field.PlateField label="Placa" action={withAction ? <button type="button">Ler</button> : undefined} />
        )}
      </form.AppField>
    </TecladoProvider>
  );
}

describe("PlateField", () => {
  it("renderiza só a placa quando não há ação", () => {
    renderWithTheme(<Harness withAction={false} />);
    expect(screen.getByLabelText("Placa")).toHaveValue("ABC1D23");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("com hideLabel o rótulo sai da tela mas continua nomeando o campo", () => {
    function Oculto() {
      const form = useAppForm({ defaultValues: { placa: "ABC1D23" } });
      return (
        <TecladoProvider>
          <form.AppField name="placa">{(field) => <field.PlateField label="Placa" hideLabel />}</form.AppField>
        </TecladoProvider>
      );
    }
    renderWithTheme(<Oculto />);
    expect(screen.getByLabelText("Placa")).toHaveValue("ABC1D23");
    expect(screen.getByText("Placa", { selector: "label" })).toHaveStyle({ position: "absolute", width: "1px" });
  });

  it("com destaque a placa tem o anel amarelo mesmo sem foco; sem destaque, não", () => {
    function Com({ destaque }: { destaque: boolean }) {
      const form = useAppForm({ defaultValues: { placa: "ABC1D23" } });
      return (
        <TecladoProvider>
          <form.AppField name="placa">{(field) => <field.PlateField label="Placa" destaque={destaque} />}</form.AppField>
        </TecladoProvider>
      );
    }
    const { unmount } = renderWithTheme(<Com destaque />);
    const comAnel = document.querySelector("label + div") as HTMLElement;
    expect(getComputedStyle(comAnel).outlineWidth).toBe("3px");
    expect(getComputedStyle(comAnel).outlineStyle).toBe("solid");
    unmount();

    renderWithTheme(<Com destaque={false} />);
    const semAnel = document.querySelector("label + div") as HTMLElement;
    expect(getComputedStyle(semAnel).outlineStyle).not.toBe("solid");
  });

  it("sem hideLabel o rótulo aparece normalmente", () => {
    renderWithTheme(<Harness withAction={false} />);
    expect(screen.getByText("Placa", { selector: "label" })).not.toHaveStyle({ position: "absolute" });
  });

  it("mostra a ação dentro da placa, sem tirar o campo", () => {
    renderWithTheme(<Harness withAction />);
    expect(screen.getByLabelText("Placa")).toHaveValue("ABC1D23");
    expect(screen.getByRole("button", { name: "Ler" })).toBeInTheDocument();
  });

  it("em aparelho de toque abre o teclado de placa e digita pelas teclas", () => {
    simularToque(true);
    renderWithTheme(<Harness withAction={false} inicial="" />);
    const campo = screen.getByLabelText("Placa");

    expect(campo).toHaveAttribute("inputmode", "none");
    act(() => campo.focus());
    expect(screen.getByRole("group", { name: "Teclado de placa" })).toBeInTheDocument();

    for (const tecla of ["a", "b", "c", "1", "d"]) {
      fireEvent.click(screen.getByRole("button", { name: tecla.toUpperCase() }));
    }

    expect(campo).toHaveValue("ABC1D");
  });

  it("no computador filtra a placa por posição", () => {
    simularToque(false);
    renderWithTheme(<Harness withAction={false} inicial="" />);
    const campo = screen.getByLabelText("Placa");

    const numeroNaPrimeira = new InputEvent("beforeinput", { data: "1", inputType: "insertText", bubbles: true, cancelable: true });
    fireEvent(campo, numeroNaPrimeira);
    const letraNaPrimeira = new InputEvent("beforeinput", { data: "A", inputType: "insertText", bubbles: true, cancelable: true });
    fireEvent(campo, letraNaPrimeira);

    expect(numeroNaPrimeira.defaultPrevented).toBe(true);
    expect(letraNaPrimeira.defaultPrevented).toBe(false);
    expect(screen.queryByRole("group")).not.toBeInTheDocument();
  });

  describe("erro de placa", () => {
    function HarnessValidado({ inicial }: { inicial: string }) {
      const form = useAppForm({
        defaultValues: { placa: inicial },
        validators: {
          onChange: ({ value }) => (isValidPlaca(value.placa) ? undefined : { fields: { placa: PLACA_INVALIDA_MESSAGE } }),
        },
        onSubmit: () => {},
      });
      return (
        <TecladoProvider>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void form.handleSubmit();
            }}
          >
            <form.AppField name="placa">{(field) => <field.PlateField label="Placa" />}</form.AppField>
            <button type="submit">Enviar</button>
          </form>
        </TecladoProvider>
      );
    }

    it("com a placa incompleta mostra só quantos caracteres faltam, sem erro", () => {
      simularToque(false);
      renderWithTheme(<HarnessValidado inicial="" />);
      const campo = screen.getByLabelText("Placa");

      fireEvent.change(campo, { target: { value: "ABC" } });

      expect(screen.getByText("Faltam 4 caracteres")).toBeInTheDocument();
      expect(screen.queryByText(PLACA_INVALIDA_MESSAGE)).not.toBeInTheDocument();
      expect(campo).toHaveAttribute("aria-invalid", "false");
    });

    it("usa o singular quando falta um caractere", () => {
      simularToque(false);
      renderWithTheme(<HarnessValidado inicial="" />);
      fireEvent.change(screen.getByLabelText("Placa"), { target: { value: "ABC1D2" } });
      expect(screen.getByText("Falta 1 caractere")).toBeInTheDocument();
    });

    it("não mostra dica com o campo vazio", () => {
      simularToque(false);
      renderWithTheme(<HarnessValidado inicial="" />);
      expect(screen.queryByText(/falt/i)).not.toBeInTheDocument();
    });

    it("com 7 caracteres fora do padrão mostra o erro vermelho", () => {
      simularToque(false);
      renderWithTheme(<HarnessValidado inicial="" />);
      const campo = screen.getByLabelText("Placa");

      fireEvent.change(campo, { target: { value: "ABCDEFG" } });

      expect(screen.getByText(PLACA_INVALIDA_MESSAGE)).toBeInTheDocument();
      expect(campo).toHaveAttribute("aria-invalid", "true");
    });

    it("ao tentar enviar com a placa incompleta mostra o erro", async () => {
      simularToque(false);
      renderWithTheme(<HarnessValidado inicial="" />);
      fireEvent.change(screen.getByLabelText("Placa"), { target: { value: "ABC" } });

      fireEvent.click(screen.getByRole("button", { name: "Enviar" }));

      expect(await screen.findByText(PLACA_INVALIDA_MESSAGE)).toBeInTheDocument();
    });

    it("a dica externa (cadastro) aparece com a placa completa e válida", () => {
      simularToque(false);
      function Com() {
        const form = useAppForm({ defaultValues: { placa: "ABC1D23" } });
        return (
          <TecladoProvider>
            <form.AppField name="placa">
              {(field) => <field.PlateField label="Placa" hint="Dados do cadastro preenchidos." hintTone="success" />}
            </form.AppField>
          </TecladoProvider>
        );
      }
      renderWithTheme(<Com />);
      expect(screen.getByText("Dados do cadastro preenchidos.")).toBeInTheDocument();
    });
  });
});
