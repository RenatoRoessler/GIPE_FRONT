import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { useAppForm } from "@/components/form";
import { prismaCampo } from "@/lib/schemas/prisma";
import { renderWithTheme } from "@/test/render";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

function Harness({ inicial = "", disabled = false }: { inicial?: string; disabled?: boolean }) {
  const validar = ({ value }: { value: { prisma: string } }) => {
    const resultado = prismaCampo(true).safeParse(value.prisma);
    return resultado.success ? undefined : { fields: { prisma: resultado.error.issues[0].message } };
  };
  const form = useAppForm({ defaultValues: { prisma: inicial }, validators: { onChange: validar, onBlur: validar } });
  return <form.AppField name="prisma">{(field) => <field.PrismaField disabled={disabled} />}</form.AppField>;
}

describe("PrismaField", () => {
  it("mostra o rótulo, a regra em texto e pede teclado numérico", () => {
    renderWithTheme(<Harness />);
    const campo = screen.getByLabelText("Prisma");
    expect(campo).toHaveAttribute("inputmode", "numeric");
    expect(campo).toHaveAttribute("maxlength", "3");
    expect(screen.getByText("Número de 1 a 999.")).toBeInTheDocument();
  });

  it("só aceita dígitos e no máximo três", async () => {
    renderWithTheme(<Harness />);
    const campo = screen.getByLabelText("Prisma");
    await userEvent.type(campo, "a1b2c3d4");
    expect(campo).toHaveValue("123");
  });

  it("colar texto com letras e símbolos deixa só os números", async () => {
    renderWithTheme(<Harness />);
    const campo = screen.getByLabelText("Prisma");
    await userEvent.click(campo);
    await userEvent.paste("4-5x");
    expect(campo).toHaveValue("45");
  });

  it("depois do blur mostra o erro com a regra e marca o campo como inválido", async () => {
    renderWithTheme(<Harness />);
    const campo = screen.getByLabelText("Prisma");
    await userEvent.type(campo, "0");
    await userEvent.tab();
    expect(await screen.findByText("Use um número de 1 a 999")).toBeInTheDocument();
    expect(campo).toHaveAttribute("aria-invalid", "true");
  });

  it("vazio e tocado pede o prisma", async () => {
    renderWithTheme(<Harness />);
    await userEvent.click(screen.getByLabelText("Prisma"));
    await userEvent.tab();
    expect(await screen.findByText("Informe o prisma (de 1 a 999)")).toBeInTheDocument();
  });

  it("desabilitado não aceita digitação", () => {
    renderWithTheme(<Harness inicial="7" disabled />);
    expect(screen.getByLabelText("Prisma")).toBeDisabled();
  });
});
