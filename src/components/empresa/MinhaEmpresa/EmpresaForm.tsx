"use client";

import { useStore } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { BusinessHoursStepFields } from "@/components/adesao/BusinessHoursStepFields";
import { CompanyStepFields } from "@/components/adesao/CompanyStepFields";
import { useAppForm, zodFieldErrors } from "@/components/form";
import { Accordion, AccordionItem } from "@/components/ui/Accordion";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Text } from "@/components/ui/Text";
import { Toast } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import { updateEmpresa } from "@/lib/api/services/empresa";
import { businessHoursSchema, companySchema } from "@/lib/schemas/adesao";
import type { EmpresaFormValues } from "@/types/empresa";
import { Actions, Page, Sections, TitleGroup } from "./MinhaEmpresa.styles";

export const EMPRESA_QUERY_KEY = ["empresa"] as const;

export interface EmpresaFormProps {
  initial: EmpresaFormValues;
}

export function EmpresaForm({ initial }: EmpresaFormProps) {
  const queryClient = useQueryClient();
  const sectionsRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState({ empresa: true, funcionamento: true });
  const { toast, showToast, dismissToast } = useToast();

  const mutation = useMutation({
    mutationFn: (values: EmpresaFormValues) => updateEmpresa(values),
    onSuccess: (_data, values) => {
      queryClient.setQueryData(EMPRESA_QUERY_KEY, values);
      companyForm.reset(values.company);
      hoursForm.reset(values.hours);
      showToast("Dados da empresa salvos com sucesso.");
    },
  });

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

  const companyDirty = useStore(companyForm.store, (state) => state.isDirty);
  const hoursDirty = useStore(hoursForm.store, (state) => state.isDirty);
  const companyInvalid = useStore(
    companyForm.store,
    (state) => state.submissionAttempts > 0 && !state.isValid,
  );
  const hoursInvalid = useStore(
    hoursForm.store,
    (state) => state.submissionAttempts > 0 && !state.isValid,
  );
  const razaoSocial = useStore(companyForm.store, (state) => state.values.razaoSocial);
  const openDays = useStore(
    hoursForm.store,
    (state) => state.values.horarios.filter((day) => day.aberto).length,
  );

  const isDirty = companyDirty || hoursDirty;
  const isSaving = mutation.isPending;

  async function handleSave() {
    // handleSubmit marca todos os campos como tocados e valida; sem erros, o estado fica válido.
    await Promise.all([companyForm.handleSubmit(), hoursForm.handleSubmit()]);

    const companyValid = companyForm.state.isValid;
    const hoursValid = hoursForm.state.isValid;

    if (!companyValid || !hoursValid) {
      setOpen((current) => ({
        empresa: current.empresa || !companyValid,
        funcionamento: current.funcionamento || !hoursValid,
      }));
      // Espera as seções abrirem antes de focar o primeiro campo inválido.
      requestAnimationFrame(() => {
        sectionsRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      });
      return;
    }

    mutation.mutate({ company: companyForm.state.values, hours: hoursForm.state.values });
  }

  function handleDiscard() {
    companyForm.reset();
    hoursForm.reset();
    mutation.reset();
  }

  return (
    <Page>
      <TitleGroup>
        <Text variant="heading" as="h1">
          Minha empresa
        </Text>
        <Text variant="muted">Consulte e atualize os dados cadastrais da sua empresa.</Text>
      </TitleGroup>

      {mutation.isError && <ErrorBanner role="alert">{mutation.error.message}</ErrorBanner>}

      <Sections ref={sectionsRef}>
        <Accordion>
          <AccordionItem
            title="Dados da empresa"
            summary={razaoSocial}
            open={open.empresa}
            onOpenChange={(value) => setOpen((current) => ({ ...current, empresa: value }))}
            hasError={companyInvalid}
          >
            <CompanyStepFields form={companyForm} disabled={isSaving} lockCnpj />
          </AccordionItem>
          <AccordionItem
            title="Funcionamento"
            summary={`${openDays} ${openDays === 1 ? "dia aberto" : "dias abertos"}`}
            open={open.funcionamento}
            onOpenChange={(value) => setOpen((current) => ({ ...current, funcionamento: value }))}
            hasError={hoursInvalid}
          >
            <BusinessHoursStepFields form={hoursForm} disabled={isSaving} />
          </AccordionItem>
        </Accordion>

        <Actions>
          <Button
            type="button"
            variant="secondary"
            onClick={handleDiscard}
            disabled={!isDirty || isSaving}
          >
            Descartar alterações
          </Button>
          <Button type="button" onClick={() => void handleSave()} disabled={!isDirty || isSaving}>
            {isSaving ? "Salvando..." : "Salvar"}
          </Button>
        </Actions>
      </Sections>

      {toast && <Toast message={toast.message} variant={toast.variant} onDismiss={dismissToast} />}
    </Page>
  );
}
