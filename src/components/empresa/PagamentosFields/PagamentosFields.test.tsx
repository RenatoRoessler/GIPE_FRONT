import { act, fireEvent, screen } from "@testing-library/react";
import { useEffect } from "react";
import { describe, expect, it } from "vitest";
import { useAppForm, zodFieldErrors } from "@/components/form";
import { PAGAMENTOS_MINIMO_MESSAGE, paymentsSchema } from "@/lib/schemas/adesao";
import { renderWithTheme } from "@/test/render";
import { EMPTY_PAYMENTS_DATA, type PaymentsData } from "@/types/adesao";
import { PagamentosFields } from "./PagamentosFields";

function useHarnessForm(initial: PaymentsData) {
  return useAppForm({
    defaultValues: initial,
    validators: {
      onChange: ({ value }) => {
        const result = paymentsSchema.safeParse(value);
        return result.success ? undefined : zodFieldErrors(result);
      },
    },
  });
}

type HarnessForm = ReturnType<typeof useHarnessForm>;
const formRef: { current: HarnessForm | null } = { current: null };
const currentForm = () => formRef.current as HarnessForm;

function Harness({ initial = EMPTY_PAYMENTS_DATA, disabled = false }: { initial?: PaymentsData; disabled?: boolean }) {
  const form = useHarnessForm(initial);
  useEffect(() => {
    formRef.current = form;
  });
  return <PagamentosFields form={form} disabled={disabled} />;
}

const meio = (nome: string) => screen.getByRole("switch", { name: nome });
const NOMES = ["Dinheiro", "Pix", "Cartão de crédito", "Cartão de débito"];

describe("PagamentosFields", () => {
  it("agrupa os quatro meios sob a legenda e o texto de apoio", () => {
    renderWithTheme(<Harness />);
    expect(screen.getByRole("group", { name: "Meios de pagamento aceitos" })).toBeInTheDocument();
    expect(screen.getByText("Só os meios ligados aparecem na saída de veículos.")).toBeInTheDocument();
  });

  it("mostra os quatro switches na ordem, com nome e estado", () => {
    renderWithTheme(<Harness />);
    expect(screen.getAllByRole("switch").map((item) => item.getAttribute("aria-label"))).toEqual(NOMES);
    expect(meio("Dinheiro")).toBeChecked();
    expect(meio("Pix")).not.toBeChecked();
    expect(meio("Cartão de crédito")).not.toBeChecked();
    expect(meio("Cartão de débito")).not.toBeChecked();
  });

  it("alterna um meio e atualiza o formulário", () => {
    renderWithTheme(<Harness />);
    fireEvent.click(meio("Pix"));
    expect(meio("Pix")).toBeChecked();
    expect(currentForm().state.values.pix).toBe(true);
    fireEvent.click(meio("Pix"));
    expect(currentForm().state.values.pix).toBe(false);
  });

  it("não mostra erro antes de qualquer interação, mesmo com tudo desligado", () => {
    renderWithTheme(
      <Harness initial={{ dinheiro: false, pix: false, cartaoCredito: false, cartaoDebito: false }} />,
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("mostra o erro do conjunto ao desligar o último meio e o liga ao grupo", () => {
    renderWithTheme(<Harness />);
    fireEvent.click(meio("Dinheiro"));
    const alerta = screen.getByRole("alert");
    expect(alerta).toHaveTextContent(PAGAMENTOS_MINIMO_MESSAGE);
    expect(screen.getByRole("group", { name: "Meios de pagamento aceitos" })).toHaveAccessibleDescription(
      PAGAMENTOS_MINIMO_MESSAGE,
    );
    for (const nome of NOMES) {
      expect(meio(nome)).toHaveAccessibleDescription(PAGAMENTOS_MINIMO_MESSAGE);
    }
  });

  it("marca só o primeiro switch como inválido para o foco do formulário", () => {
    renderWithTheme(<Harness />);
    fireEvent.click(meio("Dinheiro"));
    expect(meio("Dinheiro")).toHaveAttribute("data-invalid", "true");
    expect(meio("Pix")).not.toHaveAttribute("data-invalid");
    expect(document.querySelectorAll('[data-invalid="true"]')).toHaveLength(1);
  });

  it("o erro some ao ligar qualquer meio", () => {
    renderWithTheme(<Harness />);
    fireEvent.click(meio("Dinheiro"));
    expect(screen.getByRole("alert")).toBeInTheDocument();
    fireEvent.click(meio("Cartão de débito"));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(meio("Dinheiro")).not.toHaveAttribute("data-invalid");
    expect(meio("Dinheiro")).not.toHaveAccessibleDescription(PAGAMENTOS_MINIMO_MESSAGE);
  });

  it("mostra o erro depois de uma tentativa de envio com tudo desligado", async () => {
    renderWithTheme(
      <Harness initial={{ dinheiro: false, pix: false, cartaoCredito: false, cartaoDebito: false }} />,
    );
    await act(async () => {
      await currentForm().handleSubmit();
    });
    expect(screen.getByRole("alert")).toHaveTextContent(PAGAMENTOS_MINIMO_MESSAGE);
  });

  it("desabilita os quatro switches com disabled", () => {
    renderWithTheme(<Harness disabled />);
    for (const nome of NOMES) {
      expect(meio(nome)).toBeDisabled();
    }
  });

  it("não alterna quando desabilitado", () => {
    renderWithTheme(<Harness disabled />);
    fireEvent.click(meio("Pix"));
    expect(currentForm().state.values.pix).toBe(false);
  });
});
