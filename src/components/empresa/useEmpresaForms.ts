"use client";

import { useSelector } from "@tanstack/react-form";
import { useState, type RefObject } from "react";
import { useAppForm, zodFieldErrors } from "@/components/form";
import { businessHoursSchema, companySchema, paymentsSchema } from "@/lib/schemas/adesao";
import { MEIOS_PAGAMENTO } from "@/types/adesao";
import type { EmpresaFormValues } from "@/types/empresa";

// Os três formulários da empresa (dados, funcionamento e pagamentos) com a validação de cada um, o estado dos
// acordeões e o envio: o que "Minha empresa" e "Adicionar empresa" têm em comum.
//
// `sectionsRef` é o ref do contêiner que envolve as seções: quem renderiza o contêiner o cria e o passa, para o hook
// achar o primeiro campo inválido sem devolver um ref (o que faria o lint tratar todo o retorno como ref).
export function useEmpresaForms(initial: EmpresaFormValues, sectionsRef: RefObject<HTMLElement | null>) {
  const [open, setOpen] = useState({ empresa: true, funcionamento: true, pagamentos: true });

  const companyForm = useAppForm({
    defaultValues: initial.company,
    validators: {
      onChange: ({ value }) => {
        const result = companySchema.safeParse(value);
        return result.success ? undefined : zodFieldErrors(result);
      },
    },
  });

  const hoursForm = useAppForm({
    defaultValues: initial.hours,
    validators: {
      onChange: ({ value }) => {
        const result = businessHoursSchema.safeParse(value);
        return result.success ? undefined : zodFieldErrors(result);
      },
    },
  });

  const paymentsForm = useAppForm({
    defaultValues: initial.payments,
    validators: {
      onChange: ({ value }) => {
        const result = paymentsSchema.safeParse(value);
        return result.success ? undefined : zodFieldErrors(result);
      },
    },
  });

  const companyDirty = useSelector(companyForm.store, (state) => state.isDirty);
  const hoursDirty = useSelector(hoursForm.store, (state) => state.isDirty);
  const paymentsDirty = useSelector(paymentsForm.store, (state) => state.isDirty);
  const companyInvalid = useSelector(companyForm.store, (state) => state.submissionAttempts > 0 && !state.isValid);
  const hoursInvalid = useSelector(hoursForm.store, (state) => state.submissionAttempts > 0 && !state.isValid);
  const paymentsInvalid = useSelector(paymentsForm.store, (state) => state.submissionAttempts > 0 && !state.isValid);
  const meiosAceitos = useSelector(paymentsForm.store, (state) =>
    MEIOS_PAGAMENTO.filter(({ key }) => state.values[key])
      .map((meio) => meio.curto)
      .join(", "),
  );
  const razaoSocial = useSelector(companyForm.store, (state) => state.values.razaoSocial);
  const openDays = useSelector(hoursForm.store, (state) => state.values.horarios.filter((day) => day.aberto).length);

  // Valida os três blocos. Com erro, abre as seções recolhidas que o têm, foca o primeiro campo inválido e devolve
  // null; sem erro, devolve os valores prontos para enviar.
  async function validarTudo(): Promise<EmpresaFormValues | null> {
    // handleSubmit marca todos os campos como tocados e valida; sem erros, o estado fica válido.
    await Promise.all([companyForm.handleSubmit(), hoursForm.handleSubmit(), paymentsForm.handleSubmit()]);

    const companyValid = companyForm.state.isValid;
    const hoursValid = hoursForm.state.isValid;
    const paymentsValid = paymentsForm.state.isValid;

    if (!companyValid || !hoursValid || !paymentsValid) {
      setOpen((current) => ({
        empresa: current.empresa || !companyValid,
        funcionamento: current.funcionamento || !hoursValid,
        pagamentos: current.pagamentos || !paymentsValid,
      }));
      // Espera as seções abrirem antes de focar o primeiro campo inválido (o switch usa data-invalid).
      requestAnimationFrame(() => {
        sectionsRef.current?.querySelector<HTMLElement>('[aria-invalid="true"], [data-invalid="true"]')?.focus();
      });
      return null;
    }

    return {
      company: companyForm.state.values,
      hours: hoursForm.state.values,
      payments: paymentsForm.state.values,
    };
  }

  // Sem argumento volta aos valores com que o formulário abriu; com valores, eles passam a ser o novo "salvo".
  function reset(values?: EmpresaFormValues) {
    companyForm.reset(values?.company);
    hoursForm.reset(values?.hours);
    paymentsForm.reset(values?.payments);
  }

  return {
    companyForm,
    hoursForm,
    paymentsForm,
    open,
    setOpen,
    isDirty: companyDirty || hoursDirty || paymentsDirty,
    companyInvalid,
    hoursInvalid,
    paymentsInvalid,
    meiosAceitos,
    razaoSocial,
    openDays,
    validarTudo,
    reset,
  };
}

export type EmpresaForms = ReturnType<typeof useEmpresaForms>;
