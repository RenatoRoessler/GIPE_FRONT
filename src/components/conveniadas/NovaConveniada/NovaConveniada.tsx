"use client";

import { useSelector } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useAppForm, zodFieldErrors } from "@/components/form";
import { Actions, Page, TitleGroup } from "@/components/empresa/MinhaEmpresa/MinhaEmpresa.styles";
import { ErroSemPermissao } from "@/components/layout/ErroSemPermissao";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Text } from "@/components/ui/Text";
import { isForbiddenError } from "@/lib/api/errors";
import { conveniadaSchema } from "@/lib/schemas/conveniada";
import { EMPTY_CONVENIADA_FORM } from "@/types/conveniada";
import { FormSections, SectionTitle, VoltarWrapper } from "../Conveniadas.styles";
import { ConveniadaEmpresaFields } from "../ConveniadaEmpresaFields";
import { ConveniadaResponsavelFields } from "../ConveniadaResponsavelFields";
import { cadastroParam } from "../mensagens";
import { LISTA_URL } from "../situacao";
import { useCadastrarConveniada } from "../useCadastrarConveniada";

export function NovaConveniada() {
  const router = useRouter();
  const sectionsRef = useRef<HTMLFormElement>(null);
  const [confirmandoCancelar, setConfirmandoCancelar] = useState(false);

  const form = useAppForm({
    defaultValues: EMPTY_CONVENIADA_FORM,
    validators: {
      onChange: ({ value }) => {
        const result = conveniadaSchema.safeParse(value);
        return result.success ? undefined : zodFieldErrors(result);
      },
    },
  });
  const isDirty = useSelector(form.store, (state) => state.isDirty);

  const mutation = useCadastrarConveniada({
    // Só as flags do resultado atravessam a navegação; nenhum dado pessoal vai para a URL.
    onSuccess: (resultado) => router.push(`${LISTA_URL}?cadastro=${cadastroParam(resultado)}`),
  });
  const isSaving = mutation.isPending;

  async function handleCadastrar() {
    // handleSubmit marca todos os campos como tocados e valida; sem erros, o estado fica válido.
    await form.handleSubmit();
    if (!form.state.isValid) {
      requestAnimationFrame(() => {
        sectionsRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      });
      return;
    }
    mutation.mutate(form.state.values);
  }

  function handleCancelar() {
    if (isDirty) {
      setConfirmandoCancelar(true);
      return;
    }
    router.push(LISTA_URL);
  }

  return (
    <Page>
      <VoltarWrapper>
        <Button type="button" variant="secondary" onClick={handleCancelar} disabled={isSaving}>
          ← Voltar para conveniadas
        </Button>
      </VoltarWrapper>
      <TitleGroup>
        <Text variant="heading" as="h1">
          Nova conveniada
        </Text>
        <Text variant="muted">Cadastre a empresa e quem vai administrá-la.</Text>
      </TitleGroup>

      {mutation.isError &&
        (isForbiddenError(mutation.error) ? (
          <ErroSemPermissao message="Você não tem permissão para cadastrar conveniadas." />
        ) : (
          <ErrorBanner role="alert">{mutation.error.message}</ErrorBanner>
        ))}

      <FormSections
        ref={sectionsRef}
        noValidate
        aria-busy={isSaving}
        onSubmit={(event) => {
          event.preventDefault();
          void handleCadastrar();
        }}
      >
        <Card maxWidth="100%" role="group" aria-labelledby="conveniada-empresa">
          <SectionTitle>
            <Text variant="heading" as="h2" id="conveniada-empresa">
              Empresa
            </Text>
          </SectionTitle>
          <ConveniadaEmpresaFields form={form} disabled={isSaving} />
        </Card>
        <Card maxWidth="100%" role="group" aria-labelledby="conveniada-responsavel">
          <SectionTitle>
            <Text variant="heading" as="h2" id="conveniada-responsavel">
              Responsável
            </Text>
          </SectionTitle>
          <ConveniadaResponsavelFields form={form} disabled={isSaving} />
        </Card>

        <Actions>
          <Button type="button" variant="secondary" onClick={handleCancelar} disabled={isSaving}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSaving} aria-busy={isSaving}>
            {isSaving ? "Cadastrando…" : "Cadastrar"}
          </Button>
        </Actions>
      </FormSections>

      {confirmandoCancelar && (
        <ConfirmDialog
          title="Descartar o cadastro?"
          message="Os dados que você preencheu serão perdidos."
          confirmLabel="Descartar"
          cancelLabel="Continuar editando"
          onConfirm={() => router.push(LISTA_URL)}
          onCancel={() => setConfirmandoCancelar(false)}
        />
      )}
    </Page>
  );
}
