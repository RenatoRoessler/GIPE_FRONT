"use client";

import { useStore } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useAppForm, zodFieldErrors } from "@/components/form";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Stepper } from "@/components/ui/Stepper";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Text } from "@/components/ui/Text";
import {
  findInvalidPrecoStep,
  precoCategoriasSchema,
  precoFaixasSchema,
  precoHorariosSchema,
  precoInfoSchema,
} from "@/lib/schemas/preco";
import { parseMoney } from "@/lib/money";
import { TIPO_REGRA, type PrecoFormValues, type SituacaoPreco } from "@/types/preco";
import { PrecoCategoriasStepFields } from "../PrecoCategoriasStepFields";
import { PrecoFaixasStepFields } from "../PrecoFaixasStepFields";
import { PrecoHorariosStepFields } from "../PrecoHorariosStepFields";
import { PrecoInfoStepFields } from "../PrecoInfoStepFields";
import { hasChanges } from "../diff";
import { PrecoResumo } from "../PrecoResumo";
import { SITUACAO_BADGE } from "../situacao";
import { Actions, ActionsGroup, Form, Header, Page, SubtitleRow, TitleGroup, UnsavedNote } from "./PrecoWizard.styles";

const STEPS = ["Informações", "Horários", "Faixas de valores", "Categorias"];

const STEP_DESCRIPTIONS = [
  "Informe os dados gerais da tabela de preço.",
  "Quando esta tabela vale?",
  "Quanto é cobrado por tempo de permanência?",
  "Para quais categorias de veículo?",
];

const LAST_STEP = STEPS.length;

export interface PrecoWizardFormProps {
  title: string;
  // Valores iniciais (vazios no cadastro, preenchidos na edição). Viram os defaultValues das etapas.
  initial: PrecoFormValues;
  onSave: (values: PrecoFormValues) => Promise<void>;
  // Parâmetro `salvo` enviado à listagem para exibir o aviso de sucesso.
  savedFlag: "criado" | "atualizado";
  // Chaves de cache a invalidar após salvar.
  invalidateKeys?: readonly (readonly unknown[])[];
  // Edição: mostra o nome e a situação salva da tabela, compara com o original e só salva com mudanças.
  mode?: "create" | "edit";
  nome?: string;
  situacao?: SituacaoPreco;
}

export function PrecoWizardForm({
  title,
  initial,
  onSave,
  savedFlag,
  invalidateKeys = [],
  mode = "create",
  nome,
  situacao,
}: PrecoWizardFormProps) {
  const isEdit = mode === "edit";
  // Base estável da comparação: a tabela como foi salva, mesmo que `initial` mude entre renders.
  const [original] = useState(initial);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [stepError, setStepError] = useState<string | null>(null);
  const stepDescriptionRef = useRef<HTMLParagraphElement>(null);
  const isFirstRender = useRef(true);
  const savedRef = useRef(false);

  // Ao trocar de etapa, o foco vai para a descrição da nova etapa (leitores de tela e teclado).
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    stepDescriptionRef.current?.focus();
  }, [step]);

  const infoForm = useAppForm({
    defaultValues: initial.info,
    validators: {
      onChange: ({ value }) => {
        const result = precoInfoSchema.safeParse(value);
        return result.success ? undefined : zodFieldErrors(result);
      },
    },
    onSubmit: () => setStep(2),
  });

  const horariosForm = useAppForm({
    defaultValues: { horarios: initial.horarios },
    validators: {
      onChange: ({ value }) => {
        const result = precoHorariosSchema.safeParse(value);
        return result.success ? undefined : zodFieldErrors(result);
      },
    },
    onSubmit: () => setStep(3),
  });

  const faixasForm = useAppForm({
    defaultValues: { faixas: initial.faixas },
    validators: {
      onChange: ({ value }) => {
        const result = precoFaixasSchema.safeParse(value);
        return result.success ? undefined : zodFieldErrors(result);
      },
    },
    onSubmit: () => setStep(4),
  });

  const mutation = useMutation({
    mutationFn: onSave,
    onSuccess: async () => {
      savedRef.current = true;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["precos"] }),
        ...invalidateKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      ]);
      router.push(`/precos?salvo=${savedFlag}`);
    },
  });

  function collectValues(categorias: PrecoFormValues["categorias"]): PrecoFormValues {
    return {
      info: infoForm.state.values,
      horarios: horariosForm.state.values.horarios,
      faixas: faixasForm.state.values.faixas,
      categorias,
    };
  }

  const categoriasForm = useAppForm({
    defaultValues: { categorias: initial.categorias },
    validators: {
      onChange: ({ value }) => {
        const result = precoCategoriasSchema.safeParse(value);
        return result.success ? undefined : zodFieldErrors(result);
      },
    },
    onSubmit: async ({ value }) => {
      const values = collectValues(value.categorias);
      // Revalida tudo: uma edição em etapa anterior pode ter invalidado outra regra.
      const invalidStep = findInvalidPrecoStep(values);
      if (invalidStep !== null) {
        setStepError(`Há campos a corrigir na etapa ${invalidStep} (${STEPS[invalidStep - 1]}).`);
        setStep(invalidStep);
        return;
      }
      setStepError(null);
      await mutation.mutateAsync(values).catch(() => undefined);
    },
  });

  const infoDirty = useStore(infoForm.store, (state) => state.isDirty);
  const horariosDirty = useStore(horariosForm.store, (state) => state.isDirty);
  const faixasDirty = useStore(faixasForm.store, (state) => state.isDirty);
  const categoriasDirty = useStore(categoriasForm.store, (state) => state.isDirty);
  const isDirty = infoDirty || horariosDirty || faixasDirty || categoriasDirty;

  const infoValues = useStore(infoForm.store, (state) => state.values);
  const horariosValues = useStore(horariosForm.store, (state) => state.values.horarios);
  const faixasValues = useStore(faixasForm.store, (state) => state.values.faixas);
  const categoriasSelecionadas = useStore(categoriasForm.store, (state) => state.values.categorias);

  // Na edição, "alterado" é diferença real em relação ao salvo; `isDirty` acusaria mudança mesmo após reverter um valor.
  const hasPendingChanges = isEdit
    ? hasChanges(original, {
        info: infoValues,
        horarios: horariosValues,
        faixas: faixasValues,
        categorias: categoriasSelecionadas,
      })
    : isDirty;

  // Evita perder o preenchimento ao fechar a aba ou recarregar.
  useEffect(() => {
    if (!hasPendingChanges) {
      return;
    }
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (!savedRef.current) {
        event.preventDefault();
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasPendingChanges]);

  function handleBack() {
    setStepError(null);
    setStep((current) => Math.max(1, current - 1));
  }

  function handleCancel() {
    if (hasPendingChanges && !window.confirm("Descartar as alterações feitas nesta tabela de preço?")) {
      return;
    }
    savedRef.current = true;
    router.push("/precos");
  }

  function submit(event: FormEvent<HTMLFormElement>, run: () => void) {
    event.preventDefault();
    event.stopPropagation();
    run();
  }

  const saving = mutation.isPending;
  const diaria = {
    periodo: Number(infoValues.periodoDiaria),
    valor: parseMoney(infoValues.valorDiaria),
    adicional: parseMoney(infoValues.valorAdicionalDiaria),
  };

  return (
    <Page>
      <Card maxWidth="960px">
        <Header>
          <TitleGroup>
            <Text variant="heading" as="h1">
              {title}
            </Text>
            {isEdit && (
              <SubtitleRow>
                {nome && <strong>{nome}</strong>}
                {situacao && (
                  <StatusBadge tone={SITUACAO_BADGE[situacao].tone}>{SITUACAO_BADGE[situacao].label}</StatusBadge>
                )}
                <UnsavedNote role="status" aria-live="polite">
                  {hasPendingChanges ? "Alterações não salvas" : ""}
                </UnsavedNote>
              </SubtitleRow>
            )}
            <Text variant="muted" ref={stepDescriptionRef} tabIndex={-1}>
              Etapa {step} de {LAST_STEP}: {STEP_DESCRIPTIONS[step - 1]}
            </Text>
          </TitleGroup>
          <Stepper steps={STEPS} currentStep={step} />
        </Header>

        {step === 1 ? (
          <Form onSubmit={(event) => submit(event, () => void infoForm.handleSubmit())}>
            <PrecoInfoStepFields form={infoForm} mode={mode} />
            <Actions>
              <Button type="button" variant="secondary" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button type="submit">Avançar</Button>
            </Actions>
          </Form>
        ) : step === 2 ? (
          <Form
            onSubmit={(event) =>
              submit(event, () => {
                if (horariosForm.state.values.horarios.length === 0) {
                  setStepError("Cadastre ao menos um horário.");
                  return;
                }
                setStepError(null);
                void horariosForm.handleSubmit();
              })
            }
          >
            {stepError && <ErrorBanner role="alert">{stepError}</ErrorBanner>}
            <PrecoHorariosStepFields form={horariosForm} />
            <Actions>
              <Button type="button" variant="secondary" onClick={handleBack}>
                Voltar
              </Button>
              <Button type="submit">Avançar</Button>
            </Actions>
          </Form>
        ) : step === 3 ? (
          <Form
            onSubmit={(event) =>
              submit(event, () => {
                if (faixasForm.state.values.faixas.length === 0) {
                  setStepError("Cadastre ao menos uma faixa de valor.");
                  return;
                }
                setStepError(null);
                void faixasForm.handleSubmit();
              })
            }
          >
            {stepError && <ErrorBanner role="alert">{stepError}</ErrorBanner>}
            <PrecoFaixasStepFields
              form={faixasForm}
              showPercentual={infoValues.tipoRegra === String(TIPO_REGRA.Convenio)}
              diaria={diaria}
            />
            <Actions>
              <Button type="button" variant="secondary" onClick={handleBack}>
                Voltar
              </Button>
              <Button type="submit">Avançar</Button>
            </Actions>
          </Form>
        ) : (
          <Form onSubmit={(event) => submit(event, () => void categoriasForm.handleSubmit())}>
            {stepError && <ErrorBanner role="alert">{stepError}</ErrorBanner>}
            {mutation.isError && <ErrorBanner role="alert">{mutation.error.message}</ErrorBanner>}
            <PrecoCategoriasStepFields
              form={categoriasForm}
              disabled={saving}
              summary={<PrecoResumo values={collectValues(categoriasSelecionadas)} original={isEdit ? original : undefined} />}
            />
            <Actions>
              <Button type="button" variant="secondary" onClick={handleBack} disabled={saving}>
                Voltar
              </Button>
              <ActionsGroup>
                <Button type="button" variant="secondary" onClick={handleCancel} disabled={saving}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving || (isEdit && !hasPendingChanges)}>
                  {saving ? "Salvando..." : isEdit ? "Salvar alterações" : "Salvar"}
                </Button>
              </ActionsGroup>
            </Actions>
            {isEdit && !hasPendingChanges && <Text variant="muted">Nenhuma alteração para salvar.</Text>}
          </Form>
        )}
      </Card>
    </Page>
  );
}
