import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithTheme } from "@/test/render";
import { useAppForm } from "./form";

function Harness({ withAction }: { withAction: boolean }) {
  const form = useAppForm({ defaultValues: { placa: "ABC1D23" } });
  return (
    <form.AppField name="placa">
      {(field) => (
        <field.PlateField label="Placa" action={withAction ? <button type="button">Ler</button> : undefined} />
      )}
    </form.AppField>
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
});
