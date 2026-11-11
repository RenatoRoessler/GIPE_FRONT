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
import { GerarCartazButton } from "../CartazTicket";
import { AcoesCabecalho, HeaderRow, Page, TitleGroup } from "./MinhaEmpresa.styles";
import { EMPRESA_QUERY_KEY } from "./queryKeys";

// A chave vive em módulo próprio para quem só precisa dela não importar a tela inteira; segue exportada daqui.
export { EMPRESA_QUERY_KEY };

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
      // O formulário não edita o guid: mantém o que veio da leitura para o cache não perdê-lo (o cartaz depende dele).
      queryClient.setQueryData(EMPRESA_QUERY_KEY, { ...values, empresaGuid: initial.empresaGuid ?? null });
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
        <AcoesCabecalho>
          <GerarCartazButton />
          {podeAdicionar && (
            <Button type="button" variant="secondary" onClick={() => router.push("/minha-empresa/nova")}>
              Adicionar empresa
            </Button>
          )}
        </AcoesCabecalho>
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
