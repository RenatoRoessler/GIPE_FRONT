import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderWithTheme } from "@/test/render";
import { useAppForm } from "./form";

function Harness({ inicial, decimals = 0, step, min = 0, max = 100 }: { inicial: string; decimals?: number; step?: number; min?: number; max?: number }) {
  const form = useAppForm({ defaultValues: { valor: inicial } });
  return (
    <>
      <form.AppField name="valor" validators={{ onChange: ({ value }) => (value === "7" ? "Valor recusado" : undefined) }}>
        {(field) => <field.StepperField label="Valor" min={min} max={max} step={step} decimals={decimals} />}
      </form.AppField>
      <form.Subscribe selector={(state) => state.values.valor}>{(valor) => <output>{`salvo:${valor}`}</output>}</form.Subscribe>
    </>
  );
}

describe("StepperField", () => {
  it("anda em inteiros pelo passo e limita no máximo", async () => {
    renderWithTheme(<Harness inicial="8" step={5} max={10} />);
    await userEvent.click(screen.getByRole("button", { name: "Aumentar valor" }));
    expect(screen.getByText("salvo:10")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Aumentar valor" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Diminuir valor" }));
    expect(screen.getByText("salvo:5")).toBeInTheDocument();
  });

  it("em reais mostra o valor formatado e salva com vírgula e duas casas", async () => {
    renderWithTheme(<Harness inicial="70,00" decimals={2} step={0.5} />);
    expect(screen.getByText("R$ 70,00")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Aumentar valor" }));
    expect(screen.getByText("salvo:70,50")).toBeInTheDocument();
  });

  it("texto vazio aparece como traço e o primeiro toque leva ao mínimo", async () => {
    renderWithTheme(<Harness inicial="" min={3} />);
    expect(screen.getByText("—")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Aumentar valor" }));
    expect(screen.getByText("salvo:3")).toBeInTheDocument();
  });

  it("texto inválido também leva ao mínimo", async () => {
    renderWithTheme(<Harness inicial="abc" min={2} />);
    await userEvent.click(screen.getByRole("button", { name: "Aumentar valor" }));
    expect(screen.getByText("salvo:2")).toBeInTheDocument();
  });

  it("mostra o erro do campo", async () => {
    renderWithTheme(<Harness inicial="6" />);
    await userEvent.click(screen.getByRole("button", { name: "Aumentar valor" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Valor recusado");
  });
});
