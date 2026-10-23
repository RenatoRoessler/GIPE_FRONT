import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect, useRef } from "react";
import { ThemeProvider } from "styled-components";
import { describe, expect, it, vi } from "vitest";
import { lightTheme } from "@/styles/theme";
import { EMPTY_BUSINESS_HOURS_DATA, EMPTY_COMPANY_DATA, EMPTY_PAYMENTS_DATA, TipoEmpresa } from "@/types/adesao";
import type { EmpresaFormValues } from "@/types/empresa";
import { EmpresaSecoes } from "./EmpresaSecoes";
import { useEmpresaForms, type EmpresaForms } from "./useEmpresaForms";

const VALIDA: EmpresaFormValues = {
  company: {
    cnpj: "11.222.333/0001-81",
    razaoSocial: "Estacionamento Central LTDA",
    nomeFantasia: "Central",
    tipoEmpresa: TipoEmpresa.Estacionamento,
    telefone: "(11) 98765-4321",
    cep: "01310-100",
    logradouro: "Av. Paulista",
    numero: "1000",
    bairro: "Bela Vista",
    cidade: "São Paulo",
    estado: "SP",
    quantidadeVagasMoto: "10",
    quantidadeVagasCarro: "50",
  },
  hours: EMPTY_BUSINESS_HOURS_DATA,
  payments: { dinheiro: true, pix: false, cartaoCredito: false, cartaoDebito: false },
};

const VAZIA: EmpresaFormValues = { company: EMPTY_COMPANY_DATA, hours: EMPTY_BUSINESS_HOURS_DATA, payments: EMPTY_PAYMENTS_DATA };

let capturado: EmpresaForms | null = null;

function Tela({ initial }: { initial: EmpresaFormValues }) {
  const ref = useRef<HTMLDivElement>(null);
  const forms = useEmpresaForms(initial, ref);
  // Guarda o retorno do hook fora da renderização, para os testes chamarem validarTudo e reset.
  useEffect(() => {
    capturado = forms;
  });
  return (
    <div ref={ref}>
      <EmpresaSecoes forms={forms} />
    </div>
  );
}

function renderizar(initial: EmpresaFormValues) {
  return render(
    <ThemeProvider theme={lightTheme}>
      <Tela initial={initial} />
    </ThemeProvider>,
  );
}

// Preencher o formulário campo a campo é lento; o limite padrão ficaria perto do estouro.
vi.setConfig({ testTimeout: 20_000 });

describe("useEmpresaForms", () => {
  it("com dados válidos, validarTudo devolve os valores dos três blocos", async () => {
    renderizar(VALIDA);

    let valores: EmpresaFormValues | null = null;
    await act(async () => {
      valores = await capturado!.validarTudo();
    });

    expect(valores).not.toBeNull();
    expect(valores!.company.razaoSocial).toBe("Estacionamento Central LTDA");
    expect(valores!.payments).toEqual(VALIDA.payments);
    expect(valores!.hours.horarios).toHaveLength(EMPTY_BUSINESS_HOURS_DATA.horarios.length);
  });

  it("formulário vazio não passa e devolve null", async () => {
    renderizar(VAZIA);

    let valores: EmpresaFormValues | null = {} as EmpresaFormValues;
    await act(async () => {
      valores = await capturado!.validarTudo();
    });

    expect(valores).toBeNull();
  });

  it("com erro, marca as seções como inválidas e foca o primeiro campo inválido", async () => {
    renderizar(VAZIA);

    await act(async () => {
      await capturado!.validarTudo();
    });

    await waitFor(() => expect(capturado!.companyInvalid).toBe(true));
    await waitFor(() => expect(screen.getByLabelText(/^CNPJ/)).toHaveFocus());
  });

  it("abre a seção recolhida que tem erro", async () => {
    renderizar({ ...VALIDA, payments: { dinheiro: false, pix: false, cartaoCredito: false, cartaoDebito: false } });

    await act(async () => {
      capturado!.setOpen({ empresa: true, funcionamento: true, pagamentos: false });
    });
    expect(capturado!.open.pagamentos).toBe(false);

    await act(async () => {
      await capturado!.validarTudo();
    });

    await waitFor(() => expect(capturado!.open.pagamentos).toBe(true));
    expect(capturado!.paymentsInvalid).toBe(true);
    expect(capturado!.companyInvalid).toBe(false);
  });

  it("começa sem alterações; alterar um campo liga isDirty; reset volta ao inicial", async () => {
    const user = userEvent.setup();
    renderizar(VALIDA);
    expect(capturado!.isDirty).toBe(false);

    await user.clear(screen.getByLabelText(/^Nome fantasia/));
    await user.type(screen.getByLabelText(/^Nome fantasia/), "Outro nome");
    await waitFor(() => expect(capturado!.isDirty).toBe(true));

    await act(async () => {
      capturado!.reset();
    });

    await waitFor(() => expect(capturado!.isDirty).toBe(false));
    expect(screen.getByLabelText(/^Nome fantasia/)).toHaveValue("Central");
  });

  it("reset com valores torna esses valores o novo estado salvo", async () => {
    renderizar(VALIDA);

    await act(async () => {
      capturado!.reset({ ...VALIDA, company: { ...VALIDA.company, nomeFantasia: "Salvo agora" } });
    });

    expect(screen.getByLabelText(/^Nome fantasia/)).toHaveValue("Salvo agora");
    expect(capturado!.isDirty).toBe(false);
  });

  it("os resumos dos acordeões acompanham os valores", () => {
    renderizar(VALIDA);

    expect(capturado!.razaoSocial).toBe("Estacionamento Central LTDA");
    expect(capturado!.meiosAceitos).toBe("Dinheiro");
    expect(capturado!.openDays).toBe(EMPTY_BUSINESS_HOURS_DATA.horarios.filter((dia) => dia.aberto).length);
  });

  it("sem lockCnpj o CNPJ é editável (cadastro de empresa nova)", () => {
    renderizar(VALIDA);
    expect(screen.getByLabelText(/^CNPJ/)).toBeEnabled();
  });
});
