import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TecladoProvider } from "@/components/teclado/TecladoProvider";
import { MEDIA_TOQUE } from "@/components/teclado/useTecladoCampo";
import { renderWithTheme } from "@/test/render";
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
});
