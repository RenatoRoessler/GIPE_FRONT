"use client";

import { BusinessHoursStepFields } from "@/components/adesao/BusinessHoursStepFields";
import { CompanyStepFields } from "@/components/adesao/CompanyStepFields";
import { PagamentosFields } from "@/components/empresa/PagamentosFields";
import type { EmpresaForms } from "@/components/empresa/useEmpresaForms";
import { Accordion, AccordionItem } from "@/components/ui/Accordion";

export interface EmpresaSecoesProps {
  forms: EmpresaForms;
  disabled?: boolean;
  // CNPJ não muda depois que a empresa existe; no cadastro de uma empresa nova ele é editável.
  lockCnpj?: boolean;
}

// As três seções da empresa em acordeão (dados, funcionamento e pagamentos), com o resumo de cada uma no título.
export function EmpresaSecoes({ forms, disabled = false, lockCnpj = false }: EmpresaSecoesProps) {
  const { open, setOpen, companyForm, hoursForm, paymentsForm } = forms;

  return (
    <Accordion>
      <AccordionItem
        title="Dados da empresa"
        summary={forms.razaoSocial}
        open={open.empresa}
        onOpenChange={(value) => setOpen((current) => ({ ...current, empresa: value }))}
        hasError={forms.companyInvalid}
      >
        <CompanyStepFields form={companyForm} disabled={disabled} lockCnpj={lockCnpj} />
      </AccordionItem>
      <AccordionItem
        title="Funcionamento"
        summary={`${forms.openDays} ${forms.openDays === 1 ? "dia aberto" : "dias abertos"}`}
        open={open.funcionamento}
        onOpenChange={(value) => setOpen((current) => ({ ...current, funcionamento: value }))}
        hasError={forms.hoursInvalid}
      >
        <BusinessHoursStepFields form={hoursForm} disabled={disabled} />
      </AccordionItem>
      <AccordionItem
        title="Pagamentos"
        summary={forms.meiosAceitos}
        open={open.pagamentos}
        onOpenChange={(value) => setOpen((current) => ({ ...current, pagamentos: value }))}
        hasError={forms.paymentsInvalid}
      >
        <PagamentosFields form={paymentsForm} disabled={disabled} />
      </AccordionItem>
    </Accordion>
  );
}
