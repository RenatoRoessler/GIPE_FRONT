"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { EmpresaSecoes, painelDaEmpresa } from "@/components/empresa/EmpresaSecoes";
import { useEmpresaForms } from "@/components/empresa/useEmpresaForms";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { CadastroCorpo, PainelCadastro } from "@/components/ui/PainelCadastro";
import { Text } from "@/components/ui/Text";
import { Toast } from "@/components/ui/Toast";
import { useCan } from "@/hooks/useCan";
import { useToast } from "@/hooks/useToast";
import { updateEmpresa } from "@/lib/api/services/empresa";
import { AREA } from "@/lib/permissoes";
import type { EmpresaFormValues } from "@/types/empresa";
import { HeaderRow, Page, TitleGroup } from "./MinhaEmpresa.styles";

export const EMPRESA_QUERY_KEY = ["empresa"] as const;

export interface EmpresaFormProps {
  initial: EmpresaFormValues;
}

export function EmpresaForm({ initial }: EmpresaFormProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const podeAdicionar = useCan(AREA.Empresa);
  const sectionsRef = useRef<HTMLDivElement>(null);
  const forms = useEmpresaForms(initial, sectionsRef);
  const { toast, showToast, dismissToast } = useToast();

  const mutation = useMutation({
    mutationFn: (values: EmpresaFormValues) => updateEmpresa(values),
    onSuccess: (_data, values) => {
      queryClient.setQueryData(EMPRESA_QUERY_KEY, values);
      forms.reset(values);
      showToast("Dados da empresa salvos com sucesso.");
    },
  });

  const isSaving = mutation.isPending;
  const painel = painelDaEmpresa(forms);

  async function handleSave() {
    const values = await forms.validarTudo();
    if (values) {
      mutation.mutate(values);
    }
  }

  function handleDiscard() {
    forms.reset();
    mutation.reset();
  }

  return (
    <Page>
      <HeaderRow>
        <TitleGroup>
          <Text variant="heading" as="h1">
            Minha empresa
          </Text>
          <Text variant="muted">Consulte e atualize os dados cadastrais da sua empresa.</Text>
        </TitleGroup>
        {podeAdicionar && (
          <Button type="button" variant="secondary" onClick={() => router.push("/minha-empresa/nova")}>
            Adicionar empresa
          </Button>
        )}
      </HeaderRow>

      {mutation.isError && <ErrorBanner role="alert">{mutation.error.message}</ErrorBanner>}

      <CadastroCorpo ref={sectionsRef}>
        <EmpresaSecoes forms={forms} disabled={isSaving} lockCnpj />

        <PainelCadastro
          secoes={painel.secoes}
          onSelect={painel.onSelect}
          status={forms.isDirty ? "Alterações não salvas" : "Tudo salvo"}
        >
          <Button type="button" variant="secondary" onClick={handleDiscard} disabled={!forms.isDirty || isSaving}>
            Descartar alterações
          </Button>
          <Button type="button" onClick={() => void handleSave()} disabled={!forms.isDirty || isSaving}>
            {isSaving ? "Salvando..." : "Salvar"}
          </Button>
        </PainelCadastro>
      </CadastroCorpo>

      {toast && <Toast message={toast.message} variant={toast.variant} onDismiss={dismissToast} />}
    </Page>
  );
}
