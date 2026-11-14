import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { useFocoNoPrimeiroErro } from "./useFocoNoPrimeiroErro";

function Formulario({ invalidos }: { invalidos: string[] }) {
  const { ref, focarNoPrimeiroErro } = useFocoNoPrimeiroErro();
  const [enviado, setEnviado] = useState(false);
  return (
    <form
      ref={ref}
      onSubmit={(event) => {
        event.preventDefault();
        setEnviado(true);
        focarNoPrimeiroErro();
      }}
    >
      <input aria-label="nome" aria-invalid={enviado && invalidos.includes("nome")} />
      <input aria-label="valor" aria-invalid={enviado && invalidos.includes("valor")} />
      <input aria-label="outro" aria-invalid={enviado && invalidos.includes("outro")} />
      <button type="submit">Enviar</button>
    </form>
  );
}

describe("useFocoNoPrimeiroErro", () => {
  it("leva o foco ao primeiro campo inválido, na ordem do formulário", async () => {
    render(<Formulario invalidos={["valor", "outro"]} />);

    await userEvent.click(screen.getByRole("button", { name: "Enviar" }));

    await waitFor(() => expect(screen.getByLabelText("valor")).toHaveFocus());
  });

  it("sem erro, não mexe no foco", async () => {
    render(<Formulario invalidos={[]} />);

    await userEvent.click(screen.getByRole("button", { name: "Enviar" }));
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

    expect(screen.getByRole("button", { name: "Enviar" })).toHaveFocus();
  });
});
