"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { EmpresaCriada } from "@/components/empresa/EmpresaCriada";
import { EmpresaSecoes, painelDaEmpresa } from "@/components/empresa/EmpresaSecoes";
import { useEmpresaForms } from "@/components/empresa/useEmpresaForms";
import { Cabecalho, Page, TitleGroup } from "@/components/empresa/MinhaEmpresa/MinhaEmpresa.styles";
import { ErroSemPermissao } from "@/components/layout/ErroSemPermissao";
import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { CadastroCorpo, PainelCadastro } from "@/components/ui/PainelCadastro";
import { Text } from "@/components/ui/Text";
import { isForbiddenError } from "@/lib/api/errors";
import { addEmpresa } from "@/lib/api/services/empresa";
import { EMPTY_BUSINESS_HOURS_DATA, EMPTY_COMPANY_DATA, EMPTY_PAYMENTS_DATA } from "@/types/adesao";
import type { EmpresaFormValues } from "@/types/empresa";

// Empresa nova: tudo em branco, só dinheiro ligado e horários padrão, como na adesão.
const VAZIA: EmpresaFormValues = {
  company: EMPTY_COMPANY_DATA,
  hours: EMPTY_BUSINESS_HOURS_DATA,
  payments: EMPTY_PAYMENTS_DATA,
};

const VOLTAR_PARA = "/minha-empresa";

// Cadastro de uma nova empresa na conta do Administrador: o mesmo formulário de "Minha empresa", vazio.
export function NovaEmpresa() {
  const router = useRouter();
  const sectionsRef = useRef<HTMLDivElement>(null);
  const forms = useEmpresaForms(VAZIA, sectionsRef);
  const [criada, setCriada] = useState<string | null>(null);
  const [confirmandoCancelar, setConfirmandoCancelar] = useState(false);

  const mutation = useMutation({
    mutationFn: (values: EmpresaFormValues) => addEmpresa(values),
    onSuccess: (_data, values) => setCriada(values.company.razaoSocial.trim()),
  });

  const isSaving = mutation.isPending;
  const painel = painelDaEmpresa(forms);

  async function handleCriar() {
    const values = await forms.validarTudo();
    if (values) {
      mutation.mutate(values);
    }
  }

  function handleCancelar() {
    if (forms.isDirty) {
      setConfirmandoCancelar(true);
      return;
    }
    router.push(VOLTAR_PARA);
  }

  if (criada !== null) {
    return (
      <Page>
        <EmpresaCriada nome={criada} onVoltar={() => router.push(VOLTAR_PARA)} />
      </Page>
    );
  }

  return (
    <Page>
      <Cabecalho>
        <BackButton onClick={handleCancelar} disabled={isSaving}>
          Minha empresa
        </BackButton>
        <TitleGroup>
          <Text variant="heading" as="h1">
            Adicionar empresa
          </Text>
          <Text variant="muted">
            Cadastre outra empresa na sua conta. Você poderá entrar nela escolhendo a empresa no login.
          </Text>
        </TitleGroup>
      </Cabecalho>

      {mutation.isError &&
        (isForbiddenError(mutation.error) ? (
          <ErroSemPermissao message="Você não tem permissão para adicionar empresas." />
        ) : (
          <ErrorBanner role="alert">{mutation.error.message}</ErrorBanner>
        ))}

      <CadastroCorpo ref={sectionsRef}>
        <EmpresaSecoes forms={forms} disabled={isSaving} />

        <PainelCadastro secoes={painel.secoes} onSelect={painel.onSelect}>
          <Button type="button" variant="secondary" onClick={handleCancelar} disabled={isSaving}>
            Cancelar
          </Button>
          <Button type="button" onClick={() => void handleCriar()} disabled={isSaving}>
            {isSaving ? "Criando…" : "Criar empresa"}
          </Button>
        </PainelCadastro>
      </CadastroCorpo>

      {confirmandoCancelar && (
        <ConfirmDialog
          title="Descartar os dados da nova empresa?"
          message="Os dados que você preencheu serão perdidos."
          confirmLabel="Descartar"
          cancelLabel="Continuar editando"
          onConfirm={() => router.push(VOLTAR_PARA)}
          onCancel={() => setConfirmandoCancelar(false)}
        />
      )}
    </Page>
  );
}
