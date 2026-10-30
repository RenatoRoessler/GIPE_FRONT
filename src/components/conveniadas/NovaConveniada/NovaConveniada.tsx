"use client";

import { useSelector } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useAppForm, zodFieldErrors } from "@/components/form";
import { Cabecalho, Page, TitleGroup } from "@/components/empresa/MinhaEmpresa/MinhaEmpresa.styles";
import { ErroSemPermissao } from "@/components/layout/ErroSemPermissao";
import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { CadastroCorpo, type EstadoSecao, irParaSecao, PainelCadastro } from "@/components/ui/PainelCadastro";
import { Text } from "@/components/ui/Text";
import { isForbiddenError } from "@/lib/api/errors";
import { conveniadaSchema } from "@/lib/schemas/conveniada";
import { EMPTY_CONVENIADA_FORM } from "@/types/conveniada";
import { Secao, SecaoCabecalho, SecaoCorpo, SecaoDescricao, Secoes, SecaoTitulo } from "../Conveniadas.styles";
import { ConveniadaEmpresaFields } from "../ConveniadaEmpresaFields";
import { ConveniadaResponsavelFields } from "../ConveniadaResponsavelFields";
import { cadastroParam } from "../mensagens";
import { secaoCompleta } from "../secoes";
import { LISTA_URL } from "../situacao";
import { useCadastrarConveniada } from "../useCadastrarConveniada";

const SECAO_EMPRESA = "conveniada-empresa";
const SECAO_RESPONSAVEL = "conveniada-responsavel";

function estadoSecao(completa: boolean, tentouEnviar: boolean): EstadoSecao {
  if (completa) return "pronta";
  return tentouEnviar ? "erro" : "pendente";
}

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
  const tentouEnviar = useSelector(form.store, (state) => state.submissionAttempts > 0);
  const empresaCompleta = useSelector(form.store, (state) => secaoCompleta(state.values, "empresa"));
  const responsavelCompleto = useSelector(form.store, (state) => secaoCompleta(state.values, "responsavel"));

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
      <Cabecalho>
        <BackButton onClick={handleCancelar} disabled={isSaving}>
          Empresas conveniadas
        </BackButton>
        <TitleGroup>
          <Text variant="heading" as="h1">
            Nova conveniada
          </Text>
          <Text variant="muted">Cadastre a empresa e quem vai administrá-la.</Text>
        </TitleGroup>
      </Cabecalho>

      {mutation.isError &&
        (isForbiddenError(mutation.error) ? (
          <ErroSemPermissao message="Você não tem permissão para cadastrar conveniadas." />
        ) : (
          <ErrorBanner role="alert">{mutation.error.message}</ErrorBanner>
        ))}

      <form
        ref={sectionsRef}
        noValidate
        aria-busy={isSaving}
        onSubmit={(event) => {
          event.preventDefault();
          void handleCadastrar();
        }}
      >
        <CadastroCorpo>
          <Secoes>
            <Secao id={SECAO_EMPRESA} role="group" aria-labelledby={`${SECAO_EMPRESA}-titulo`}>
              <SecaoCabecalho>
                <SecaoTitulo id={`${SECAO_EMPRESA}-titulo`}>Empresa</SecaoTitulo>
                <SecaoDescricao>Dados cadastrais e endereço da empresa conveniada.</SecaoDescricao>
              </SecaoCabecalho>
              <SecaoCorpo>
                <ConveniadaEmpresaFields form={form} disabled={isSaving} />
              </SecaoCorpo>
            </Secao>

            <Secao id={SECAO_RESPONSAVEL} role="group" aria-labelledby={`${SECAO_RESPONSAVEL}-titulo`}>
              <SecaoCabecalho>
                <SecaoTitulo id={`${SECAO_RESPONSAVEL}-titulo`}>Responsável</SecaoTitulo>
                <SecaoDescricao>
                  Quem vai administrar a conveniada. Se o CPF já tem cadastro, ele ganha acesso a esta conveniada e não
                  recebe e-mail.
                </SecaoDescricao>
              </SecaoCabecalho>
              <SecaoCorpo>
                <ConveniadaResponsavelFields form={form} disabled={isSaving} />
              </SecaoCorpo>
            </Secao>
          </Secoes>

          <PainelCadastro
            secoes={[
              {
                id: SECAO_EMPRESA,
                titulo: "Empresa",
                estado: estadoSecao(empresaCompleta, tentouEnviar),
              },
              {
                id: SECAO_RESPONSAVEL,
                titulo: "Responsável",
                estado: estadoSecao(responsavelCompleto, tentouEnviar),
              },
            ]}
            onSelect={irParaSecao}
          >
            <Button type="button" variant="secondary" onClick={handleCancelar} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving} aria-busy={isSaving}>
              {isSaving ? "Cadastrando…" : "Cadastrar"}
            </Button>
          </PainelCadastro>
        </CadastroCorpo>
      </form>

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
