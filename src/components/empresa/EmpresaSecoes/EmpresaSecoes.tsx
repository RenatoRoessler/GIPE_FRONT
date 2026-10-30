"use client";

import { BusinessHoursStepFields } from "@/components/adesao/BusinessHoursStepFields";
import { CompanyStepFields } from "@/components/adesao/CompanyStepFields";
import { PagamentosFields } from "@/components/empresa/PagamentosFields";
import type { EmpresaForms } from "@/components/empresa/useEmpresaForms";
import { Accordion, AccordionItem } from "@/components/ui/Accordion";
import { type EstadoSecao, irParaSecao, type SecaoPainel } from "@/components/ui/PainelCadastro";

type ChaveSecao = keyof EmpresaForms["open"];

const SECAO_ID: Record<ChaveSecao, string> = {
  empresa: "empresa-dados",
  funcionamento: "empresa-funcionamento",
  pagamentos: "empresa-pagamentos",
};

function estado(invalida: boolean, completa: boolean): EstadoSecao {
  if (invalida) return "erro";
  return completa ? "pronta" : "pendente";
}

// Estado das três seções e o atalho para cada uma, no formato do PainelCadastro: abre a seção e rola até ela.
export function painelDaEmpresa(forms: EmpresaForms): {
  secoes: SecaoPainel[];
  onSelect: (id: string) => void;
} {
  const secoes: SecaoPainel[] = [
    {
      id: SECAO_ID.empresa,
      titulo: "Dados da empresa",
      estado: estado(forms.companyInvalid, forms.companyComplete),
    },
    {
      id: SECAO_ID.funcionamento,
      titulo: "Funcionamento",
      estado: estado(forms.hoursInvalid, forms.hoursComplete),
    },
    {
      id: SECAO_ID.pagamentos,
      titulo: "Pagamentos",
      estado: estado(forms.paymentsInvalid, forms.paymentsComplete),
    },
  ];

  function onSelect(id: string) {
    const chave = (Object.keys(SECAO_ID) as ChaveSecao[]).find((key) => SECAO_ID[key] === id);
    if (!chave) return;
    forms.setOpen((current) => ({ ...current, [chave]: true }));
    // Espera a seção abrir antes de rolar e focar.
    requestAnimationFrame(() => irParaSecao(id));
  }

  return { secoes, onSelect };
}

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
        id={SECAO_ID.empresa}
        title="Dados da empresa"
        summary={forms.razaoSocial}
        open={open.empresa}
        onOpenChange={(value) => setOpen((current) => ({ ...current, empresa: value }))}
        hasError={forms.companyInvalid}
      >
        <CompanyStepFields form={companyForm} disabled={disabled} lockCnpj={lockCnpj} />
      </AccordionItem>
      <AccordionItem
        id={SECAO_ID.funcionamento}
        title="Funcionamento"
        summary={`${forms.openDays} ${forms.openDays === 1 ? "dia aberto" : "dias abertos"}`}
        open={open.funcionamento}
        onOpenChange={(value) => setOpen((current) => ({ ...current, funcionamento: value }))}
        hasError={forms.hoursInvalid}
      >
        <BusinessHoursStepFields form={hoursForm} disabled={disabled} />
      </AccordionItem>
      <AccordionItem
        id={SECAO_ID.pagamentos}
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
