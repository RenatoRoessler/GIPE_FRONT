"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { ErrorDialog } from "@/components/ui/ErrorDialog";
import { CadastroCorpo, irParaSecao, PainelCadastro } from "@/components/ui/PainelCadastro";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Text } from "@/components/ui/Text";
import { parseMoney } from "@/lib/money";
import { findInvalidPrecoSecao, validarSecoesPreco, type PrecoSecaoId } from "@/lib/schemas/preco";
import type { PrecoFormValues, SituacaoPreco } from "@/types/preco";
import { diffPreco, hasChanges } from "../diff";
import { PrecoResumoAoVivo } from "../PrecoResumoAoVivo";
import { estadoDaSecao, idDaSecao, mudancasDaSecao, SECOES, secaoDoElemento } from "../secoes";
import { SITUACAO_BADGE } from "../situacao";
import { usePrecoConvenios } from "../usePrecoConvenios";
import { Cabecalho, Lateral, Page, SubtitleRow, TitleGroup, UnsavedNote } from "./PrecoWizard.styles";
import { PrecoSecoes } from "./PrecoSecoes";
import { usePrecoForms } from "./usePrecoForms";

export interface PrecoWizardFormProps {
  title: string;
  // Valores iniciais (vazios no cadastro, preenchidos na edição). Viram os defaultValues dos formulários.
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

function textoDoStatus(pendencias: string[], mudancas: number, isEdit: boolean): string {
  if (pendencias.length > 0) {
    return `Faltam: ${pendencias[0]}${pendencias.length > 1 ? ` (+${pendencias.length - 1})` : ""}`;
  }
  if (isEdit) {
    return mudancas > 0 ? `${mudancas} ${mudancas === 1 ? "mudança" : "mudanças"}` : "Tudo salvo";
  }
  return "Pronta para salvar";
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
  const forms = usePrecoForms(initial);
  const { values, isDirty, faixasDirty } = forms;
  // Cadastro novo começa na primeira seção; a edição, com todas fechadas e o resumo do que já está salvo.
  const [aberta, setAberta] = useState<PrecoSecaoId | null>(isEdit ? null : "basico");
  // Seções já abertas: só depois de visitada uma seção incompleta passa a mostrar pendência.
  const [visitadas, setVisitadas] = useState<ReadonlySet<PrecoSecaoId>>(() => new Set(isEdit ? [] : ["basico"]));
  // Seção onde a última tentativa de salvar encontrou erros; o aviso some quando ela fica válida.
  const [falhaSecao, setFalhaSecao] = useState<PrecoSecaoId | null>(null);
  // Popup com o erro do salvamento; o aviso na seção continua até a próxima tentativa.
  const [erroSalvarAberto, setErroSalvarAberto] = useState(false);
  const savedRef = useRef(false);

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

  // Na edição, "alterado" é diferença real em relação ao salvo; `isDirty` acusaria mudança mesmo após reverter um valor.
  const hasPendingChanges = isEdit ? hasChanges(original, values) : isDirty;

  const mensagens = validarSecoesPreco(values);
  const todasAsMensagens = SECOES.flatMap((secao) => mensagens[secao.id]);
  const prontaParaSalvar = todasAsMensagens.length === 0;
  const diff = isEdit ? diffPreco(original, values) : null;
  const totalMudancas = diff ? SECOES.reduce((total, secao) => total + mudancasDaSecao(secao.id, diff).length, 0) : 0;

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

  // Abre a seção (as outras fecham), marca como visitada e rola até ela depois que o layout assenta. `null` só fecha.
  function abrir(id: PrecoSecaoId | null) {
    setAberta(id);
    if (id === null) {
      return;
    }
    setVisitadas((atual) => new Set(atual).add(id));
    requestAnimationFrame(() => irParaSecao(idDaSecao(id)));
  }

  function handleCancel() {
    if (hasPendingChanges && !window.confirm("Descartar as alterações feitas nesta tabela de preço?")) {
      return;
    }
    savedRef.current = true;
    router.push("/precos");
  }

  async function salvar() {
    // Marca todos os campos como tocados para que os erros apareçam quando a seção for aberta.
    await forms.submitAll();
    const invalida = findInvalidPrecoSecao(values);
    if (invalida !== null) {
      setFalhaSecao(invalida);
      abrir(invalida);
      return;
    }
    setFalhaSecao(null);
    await mutation.mutateAsync(values).catch(() => undefined);
  }

  const saving = mutation.isPending;
  const podeSalvar = !saving && (isEdit ? hasPendingChanges : prontaParaSalvar);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!saving && (!isEdit || hasPendingChanges)) {
      void salvar();
    }
  }

  // No cadastro novo os degraus partem de um modelo padrão: só contam como definidos depois de mexer neles ou na diária.
  const faixasEditadas = isEdit || faixasDirty || Number.isFinite(parseMoney(values.info.valorDiaria));
  const falhaAtiva = falhaSecao !== null && mensagens[falhaSecao].length > 0 ? falhaSecao : null;
  const secoesPainel = SECOES.map((secao) => ({
    id: idDaSecao(secao.id),
    titulo: secao.titulo,
    estado: estadoDaSecao({
      mensagens: mensagens[secao.id],
      visitada: visitadas.has(secao.id),
      aberta: aberta === secao.id,
      falhou: falhaAtiva === secao.id,
    }),
  }));
  const etapasCompletas = [
    mensagens.basico.length === 0 && mensagens.categorias.length === 0,
    mensagens.horarios.length === 0,
    mensagens.cobranca.length === 0,
  ] as const;

  return (
    <Page>
      <Cabecalho>
        <BackButton onClick={handleCancel} disabled={saving}>
          Preços
        </BackButton>
        <TitleGroup>
          <Text variant="heading" as="h1">
            {title}
          </Text>
          {isEdit && (
            <SubtitleRow>
              {nome && <strong>{nome}</strong>}
              {situacao && <StatusBadge tone={SITUACAO_BADGE[situacao].tone}>{SITUACAO_BADGE[situacao].label}</StatusBadge>}
              <UnsavedNote role="status" aria-live="polite">
                {hasPendingChanges ? "Alterações não salvas" : ""}
              </UnsavedNote>
            </SubtitleRow>
          )}
        </TitleGroup>
      </Cabecalho>

      {mutation.isError && <ErrorBanner role="alert">{mutation.error.message}</ErrorBanner>}

      <form noValidate aria-busy={saving} onSubmit={handleSubmit}>
        <CadastroCorpo>
          <PrecoSecoes
            forms={forms}
            original={isEdit ? original : undefined}
            aberta={aberta}
            onAbrir={abrir}
            mensagens={mensagens}
            visitadas={visitadas}
            falhaSecao={falhaAtiva}
            faixasEditadas={faixasEditadas}
            disabled={saving}
            convenios={{
              data: convenios.data,
              erro: convenios.error?.message,
              estado: convenios.isError ? "erro" : convenios.isPending ? "carregando" : "pronto",
            }}
          />

          <Lateral>
            <PainelCadastro
              secoes={secoesPainel}
              onSelect={(elementoId) => {
                const id = secaoDoElemento(elementoId);
                if (id) {
                  abrir(id);
                }
              }}
              status={textoDoStatus(todasAsMensagens, totalMudancas, isEdit)}
            >
              <Button type="button" variant="secondary" onClick={handleCancel} disabled={saving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={!podeSalvar} aria-busy={saving}>
                {saving ? "Salvando..." : isEdit ? "Salvar alterações" : "Salvar"}
              </Button>
            </PainelCadastro>
            <PrecoResumoAoVivo
              values={values}
              original={isEdit ? original : undefined}
              etapasCompletas={etapasCompletas}
              faixasEditadas={faixasEditadas}
            />
          </Lateral>
        </CadastroCorpo>
      </form>

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
