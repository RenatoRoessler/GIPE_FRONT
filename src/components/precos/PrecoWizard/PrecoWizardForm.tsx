"use client";

import { useStore } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useAppForm, zodFieldErrors } from "@/components/form";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { ErrorDialog } from "@/components/ui/ErrorDialog";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Text } from "@/components/ui/Text";
import {
  findInvalidPrecoStep,
  precoCategoriasSchema,
  precoFaixasSchema,
  precoHorariosSchema,
  precoInfoSchema,
  validarEtapasPreco,
} from "@/lib/schemas/preco";
import { parseMoney } from "@/lib/money";
import { TIPO_REGRA, type PrecoFormValues, type SituacaoPreco } from "@/types/preco";
import { PrecoBasicoFields } from "../PrecoBasicoFields";
import { PrecoCategoriasStepFields } from "../PrecoCategoriasStepFields";
import { PrecoCobrancaFields } from "../PrecoCobrancaFields";
import { PrecoEtapasNav, type EtapaNav } from "../PrecoEtapasNav";
import { PrecoFaixasStepFields } from "../PrecoFaixasStepFields";
import { GradeHorarios } from "../GradeHorarios";
import { horariosForaDaGrade } from "../grade";
import { PrecoHorariosStepFields } from "../PrecoHorariosStepFields";
import { PrecoResumoAoVivo } from "../PrecoResumoAoVivo";
import { usePrecoConvenios } from "../usePrecoConvenios";
import { hasChanges } from "../diff";
import { Section, SectionTitle } from "../shared/FormSection.styles";
import { SITUACAO_BADGE } from "../situacao";
import {
  Actions,
  ActionsGroup,
  AjusteFino,
  Corpo,
  ErrosEtapa,
  Form,
  Header,
  Page,
  Pendencias,
  SubtitleRow,
  TitleGroup,
  TitleRow,
  UnsavedNote,
} from "./PrecoWizard.styles";

const ETAPAS = [
  { titulo: "O básico", apoio: "Nome, tipo, vigência, categorias", descricao: "Quem é esta tabela e a quais veículos ela vale?" },
  { titulo: "Quando vale", apoio: "Dias e horários de cobrança", descricao: "Em quais dias e horários esta tabela cobra?" },
  { titulo: "Quanto cobra", apoio: "Degraus, diária e tolerâncias", descricao: "Quanto é cobrado por tempo de permanência?" },
] as const;

const ULTIMA_ETAPA = ETAPAS.length;

const CAMPOS_DO_BASICO = ["descricao", "tipoRegra", "inicioVigencia", "fimVigencia"] as const;

export interface PrecoWizardFormProps {
  title: string;
  // Valores iniciais (vazios no cadastro, preenchidos na edição). Viram os defaultValues das etapas.
  initial: PrecoFormValues;
  onSave: (values: PrecoFormValues) => Promise<void>;
  // Parâmetro `salvo` enviado à listagem para exibir o aviso de sucesso.
  savedFlag: "criado" | "atualizado";
  // Chaves de cache a invalidar após salvar.
  invalidateKeys?: readonly (readonly unknown[])[];
  // Edição: id da tabela salva, devolvido à tela de preços para ela voltar com essa tabela selecionada.
  savedPrecoId?: number;
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
  savedPrecoId,
  mode = "create",
  nome,
  situacao,
}: PrecoWizardFormProps) {
  const isEdit = mode === "edit";
  // Base estável da comparação: a tabela como foi salva, mesmo que `initial` mude entre renders.
  const [original] = useState(initial);
  const router = useRouter();
  const queryClient = useQueryClient();
  const convenios = usePrecoConvenios();
  const [step, setStep] = useState(1);
  // Etapas já abertas: só depois de visitada uma etapa incompleta passa a mostrar pendência.
  const [visitadas, setVisitadas] = useState<ReadonlySet<number>>(() => new Set([1]));
  // Etapa onde a última tentativa de salvar encontrou erros; o aviso some quando ela fica válida.
  const [falhaEtapa, setFalhaEtapa] = useState<number | null>(null);
  // Popup com o erro do salvamento; o aviso na etapa continua até a próxima tentativa.
  const [erroSalvarAberto, setErroSalvarAberto] = useState(false);
  const [semFim, setSemFim] = useState(initial.info.fimVigencia === "");
  // O ajuste fino já abre quando a tabela tem horários que a grade não desenha (minutos, inativos, períodos).
  const [ajusteFinoAberto, setAjusteFinoAberto] = useState(() => horariosForaDaGrade(initial.horarios).length > 0);
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

  // As etapas navegam livremente: o envio é feito no fim, então os formulários não têm ação própria.
  const infoForm = useAppForm({
    defaultValues: initial.info,
    validators: {
      onChange: ({ value }) => {
        const result = precoInfoSchema.safeParse(value);
        return result.success ? undefined : zodFieldErrors(result);
      },
    },
  });

  const horariosForm = useAppForm({
    defaultValues: { horarios: initial.horarios },
    validators: {
      onChange: ({ value }) => {
        const result = precoHorariosSchema.safeParse(value);
        return result.success ? undefined : zodFieldErrors(result);
      },
    },
  });

  const faixasForm = useAppForm({
    defaultValues: { faixas: initial.faixas },
    validators: {
      onChange: ({ value }) => {
        const result = precoFaixasSchema.safeParse(value);
        return result.success ? undefined : zodFieldErrors(result);
      },
    },
  });

  const categoriasForm = useAppForm({
    defaultValues: { categorias: initial.categorias },
    validators: {
      onChange: ({ value }) => {
        const result = precoCategoriasSchema.safeParse(value);
        return result.success ? undefined : zodFieldErrors(result);
      },
    },
  });

  const mutation = useMutation({
    mutationFn: onSave,
    onSuccess: async () => {
      savedRef.current = true;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["precos"] }),
        ...invalidateKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      ]);
      router.push(`/precos?salvo=${savedFlag}${savedPrecoId === undefined ? "" : `&preco=${savedPrecoId}`}`);
    },
    onError: () => setErroSalvarAberto(true),
  });

  const infoValues = useStore(infoForm.store, (state) => state.values);
  const horariosValues = useStore(horariosForm.store, (state) => state.values.horarios);
  const faixasValues = useStore(faixasForm.store, (state) => state.values.faixas);
  const categoriasSelecionadas = useStore(categoriasForm.store, (state) => state.values.categorias);

  const infoDirty = useStore(infoForm.store, (state) => state.isDirty);
  const horariosDirty = useStore(horariosForm.store, (state) => state.isDirty);
  const faixasDirty = useStore(faixasForm.store, (state) => state.isDirty);
  const categoriasDirty = useStore(categoriasForm.store, (state) => state.isDirty);
  const isDirty = infoDirty || horariosDirty || faixasDirty || categoriasDirty;

  const values: PrecoFormValues = {
    info: infoValues,
    horarios: horariosValues,
    faixas: faixasValues,
    categorias: categoriasSelecionadas,
  };

  // Na edição, "alterado" é diferença real em relação ao salvo; `isDirty` acusaria mudança mesmo após reverter um valor.
  const hasPendingChanges = isEdit ? hasChanges(original, values) : isDirty;

  const mensagensPorEtapa = validarEtapasPreco(values);
  const mensagens = [mensagensPorEtapa.basico, mensagensPorEtapa.horarios, mensagensPorEtapa.cobranca];
  const etapasCompletas = [mensagens[0].length === 0, mensagens[1].length === 0, mensagens[2].length === 0] as const;
  const totalCompletas = etapasCompletas.filter(Boolean).length;

  const etapasNav: EtapaNav[] = ETAPAS.map((etapa, index) => {
    const numero = index + 1;
    let estado: EtapaNav["estado"] = "neutra";
    if (etapasCompletas[index]) {
      estado = "completa";
    } else if (visitadas.has(numero) && numero !== step) {
      estado = "pendencia";
    }
    return { titulo: etapa.titulo, apoio: etapa.apoio, estado };
  });

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

  function irParaEtapa(numero: number) {
    setVisitadas((atual) => new Set(atual).add(numero));
    setStep(numero);
  }

  function handleCancel() {
    if (hasPendingChanges && !window.confirm("Descartar as alterações feitas nesta tabela de preço?")) {
      return;
    }
    savedRef.current = true;
    router.push("/precos");
  }

  async function salvar() {
    // Marca todos os campos como tocados para que os erros apareçam quando a etapa for aberta.
    await Promise.all([
      infoForm.handleSubmit(),
      horariosForm.handleSubmit(),
      faixasForm.handleSubmit(),
      categoriasForm.handleSubmit(),
    ]);
    const invalidStep = findInvalidPrecoStep(values);
    if (invalidStep !== null) {
      setFalhaEtapa(invalidStep);
      irParaEtapa(invalidStep);
      return;
    }
    setFalhaEtapa(null);
    await mutation.mutateAsync(values).catch(() => undefined);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (step < ULTIMA_ETAPA && pendentesDaEtapa.length > 0) {
      // O botão já fica desabilitado; isto cobre o Enter no formulário e deixa os erros dos campos da etapa visíveis.
      for (const campo of CAMPOS_DO_BASICO) {
        if (step === 1) {
          infoForm.setFieldMeta(campo, (meta) => ({ ...meta, isTouched: true }));
        }
      }
      void categoriasForm.handleSubmit();
      return;
    }
    if (step < ULTIMA_ETAPA) {
      irParaEtapa(step + 1);
      return;
    }
    void salvar();
  }

  const saving = mutation.isPending;
  const mensagensDoAviso = falhaEtapa === step ? mensagens[step - 1] : [];
  const prontaParaSalvar = totalCompletas === ULTIMA_ETAPA;
  // O que falta na etapa atual: libera o "Avançar" e, na última etapa, o "Salvar".
  const pendentesDaEtapa = mensagens[step - 1];

  return (
    <Page>
      <Card maxWidth="1120px">
        <Header>
          <TitleGroup>
            <TitleRow>
              <Text variant="heading" as="h1">
                {title}
              </Text>
              <StatusBadge tone={prontaParaSalvar ? "success" : "neutral"}>
                {prontaParaSalvar ? "Pronta para salvar" : `Rascunho · ${totalCompletas} de ${ULTIMA_ETAPA} etapas`}
              </StatusBadge>
            </TitleRow>
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
              Etapa {step} de {ULTIMA_ETAPA}: {ETAPAS[step - 1].descricao}
            </Text>
          </TitleGroup>
          <PrecoEtapasNav etapas={etapasNav} atual={step} onSelect={irParaEtapa} />
        </Header>

        <Corpo>
          <Form onSubmit={handleSubmit}>
            {mensagensDoAviso.length > 0 && (
              <ErrorBanner role="alert">
                Há campos a corrigir na etapa {step} ({ETAPAS[step - 1].titulo}).
                <ErrosEtapa>
                  {mensagensDoAviso.map((mensagem, index) => (
                    <li key={`${mensagem}-${index}`}>{mensagem}</li>
                  ))}
                </ErrosEtapa>
              </ErrorBanner>
            )}
            {step === ULTIMA_ETAPA && mutation.isError && <ErrorBanner role="alert">{mutation.error.message}</ErrorBanner>}

            {step === 1 && (
              <>
                <PrecoBasicoFields
                  form={infoForm}
                  disabled={saving}
                  semFim={semFim}
                  onSemFimChange={setSemFim}
                  convenios={convenios.data ?? []}
                  conveniosErro={convenios.error?.message}
                  conveniosState={convenios.isError ? "erro" : convenios.isPending ? "carregando" : "pronto"}
                />
                <Section>
                  <SectionTitle>Categorias de veículo</SectionTitle>
                  <PrecoCategoriasStepFields form={categoriasForm} disabled={saving} />
                </Section>
              </>
            )}
            {step === 2 && (
              <>
                <GradeHorarios form={horariosForm} disabled={saving} />
                <AjusteFino open={ajusteFinoAberto} onToggle={(event) => setAjusteFinoAberto(event.currentTarget.open)}>
                  <summary>Ajuste fino: minutos exatos, horários inativos e períodos específicos</summary>
                  <PrecoHorariosStepFields form={horariosForm} disabled={saving} />
                </AjusteFino>
              </>
            )}
            {step === 3 && (
              <>
                <Section>
                  <SectionTitle>Faixas de valores</SectionTitle>
                  <PrecoFaixasStepFields
                    form={faixasForm}
                    disabled={saving}
                    showPercentual={infoValues.tipoRegra === String(TIPO_REGRA.Convenio)}
                    diariaValor={parseMoney(infoValues.valorDiaria)}
                  />
                </Section>
                <PrecoCobrancaFields form={infoForm} disabled={saving} />
              </>
            )}

            {pendentesDaEtapa.length > 0 && (
              <Pendencias role="status" aria-live="polite">
                <strong>{step < ULTIMA_ETAPA ? "Para avançar, falta:" : "Para salvar, falta:"}</strong>
                <ul>
                  {pendentesDaEtapa.map((mensagem, index) => (
                    <li key={`${mensagem}-${index}`}>{mensagem}</li>
                  ))}
                </ul>
              </Pendencias>
            )}

            <Actions>
              {step === 1 ? (
                <Button type="button" variant="secondary" onClick={handleCancel} disabled={saving}>
                  Cancelar
                </Button>
              ) : (
                <Button type="button" variant="secondary" onClick={() => irParaEtapa(step - 1)} disabled={saving}>
                  Voltar
                </Button>
              )}
              {step < ULTIMA_ETAPA ? (
                <Button type="submit" disabled={pendentesDaEtapa.length > 0}>
                  Avançar: {ETAPAS[step].titulo.toLowerCase()}
                </Button>
              ) : (
                <ActionsGroup>
                  <Button type="button" variant="secondary" onClick={handleCancel} disabled={saving}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saving || pendentesDaEtapa.length > 0 || (isEdit && !hasPendingChanges)}>
                    {saving ? "Salvando..." : isEdit ? "Salvar alterações" : "Salvar"}
                  </Button>
                </ActionsGroup>
              )}
            </Actions>
            {isEdit && !hasPendingChanges && step === ULTIMA_ETAPA && (
              <Text variant="muted">Nenhuma alteração para salvar.</Text>
            )}
          </Form>

          <PrecoResumoAoVivo values={values} original={isEdit ? original : undefined} etapasCompletas={etapasCompletas} />
        </Corpo>
      </Card>
      {erroSalvarAberto && mutation.isError && (
        <ErrorDialog
          title={isEdit ? "Não foi possível salvar as alterações" : "Não foi possível cadastrar o preço"}
          message={mutation.error.message}
          onClose={() => setErroSalvarAberto(false)}
          closeLabel="Voltar ao formulário"
          actionLabel="Tentar novamente"
          onAction={() => {
            setErroSalvarAberto(false);
            void salvar();
          }}
        />
      )}
    </Page>
  );
}
