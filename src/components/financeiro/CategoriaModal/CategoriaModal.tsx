"use client";

import { useStore } from "@tanstack/react-form";
import { useId, useState } from "react";
import { useAppForm, zodFieldErrors } from "@/components/form";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Modal } from "@/components/ui/Modal";
import { ApiError } from "@/lib/api/errors";
import { categoriaSchema } from "@/lib/schemas/financeiro";
import { TIPO_LANCAMENTO, type CategoriaFormValues, type FinanceiroCategoria } from "@/types/financeiro";
import { agrupaOutras, paisElegiveis } from "../categorias";
import { useCategoriaMutations } from "../useCategoriaMutations";
import { useCategorias } from "../useCategorias";
import { Form } from "./CategoriaModal.styles";

export interface CategoriaModalProps {
  // Presente => edição.
  categoria?: FinanceiroCategoria;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

const NOME_MAX = 100;

const TIPOS = [
  { value: String(TIPO_LANCAMENTO.Entrada), label: "Receita (entrada)" },
  { value: String(TIPO_LANCAMENTO.Saida), label: "Despesa (saída)" },
];

// [A CONFIRMAR] O back responde 400 para "nome já usado por categoria ativa"; sem código de erro estruturado,
// a heurística é a mensagem citar o nome repetido. Trocar por checagem de código quando existir.
function isNomeRepetido(error: unknown): error is ApiError {
  return error instanceof ApiError && error.kind === "validation" && /j[aá] exist|j[aá] (est[aá] )?(em )?uso|duplic|mesmo nome|nome/i.test(error.message);
}

function valoresIniciais(categoria?: FinanceiroCategoria): CategoriaFormValues {
  if (!categoria) {
    // Despesa é o que mais se cadastra.
    return { nome: "", tipo: String(TIPO_LANCAMENTO.Saida), financeiroCategoriaPaiId: "", ativo: true };
  }
  return {
    nome: categoria.nome,
    tipo: String(categoria.tipo),
    financeiroCategoriaPaiId: categoria.financeiroCategoriaPaiId === null ? "" : String(categoria.financeiroCategoriaPaiId),
    ativo: categoria.ativo,
  };
}

export function CategoriaModal({ categoria, onClose, onSuccess }: CategoriaModalProps) {
  const formId = useId();
  const isEdit = Boolean(categoria);
  const initialValues = valoresIniciais(categoria);
  const [confirmingClose, setConfirmingClose] = useState(false);
  const { data: categorias = [] } = useCategorias();
  const { criar, editar } = useCategoriaMutations();
  const mutation = isEdit ? editar : criar;

  const form = useAppForm({
    defaultValues: initialValues,
    validators: {
      onChange: ({ value }) => {
        const result = categoriaSchema.safeParse(value);
        return result.success ? undefined : zodFieldErrors(result);
      },
    },
    onSubmit: ({ value }) => {
      const concluir = () => {
        onSuccess(isEdit ? "Categoria atualizada." : "Categoria salva.");
        onClose();
      };
      if (categoria) {
        editar.mutate({ id: categoria.financeiroCategoriaId, values: value }, { onSuccess: concluir });
      } else {
        criar.mutate(value, { onSuccess: concluir });
      }
    },
  });

  const values = useStore(form.store, (state) => state.values);
  const hasChanges = JSON.stringify(values) !== JSON.stringify(initialValues);
  const tipo = Number(values.tipo) as 1 | 2;
  const ativa = values.ativo;

  // A categoria que já agrupa outras não pode virar subcategoria.
  const agrupa = categoria ? agrupaOutras(categorias, categoria.financeiroCategoriaId) : false;
  const pais = paisElegiveis(categorias, { tipo, categoriaId: categoria?.financeiroCategoriaId });
  // O pai atual aparece mesmo que tenha sido inativado depois: sem isso o campo mostraria "Nenhuma" e salvar apagaria o vínculo.
  const paiAtual = values.financeiroCategoriaPaiId;
  const paiForaDaLista = paiAtual !== "" && !pais.some((pai) => String(pai.financeiroCategoriaId) === paiAtual);
  const paiInativo = paiForaDaLista ? categorias.find((item) => String(item.financeiroCategoriaId) === paiAtual) : undefined;

  const isSending = mutation.isPending;
  const nomeRepetido = mutation.isError && isNomeRepetido(mutation.error);

  function handleClose() {
    if (isSending) {
      return;
    }
    // Com alterações em andamento, pede confirmação antes de descartar.
    if (hasChanges) {
      setConfirmingClose(true);
      return;
    }
    onClose();
  }

  return (
    <Modal
      open
      title={isEdit ? "Editar categoria" : "Nova categoria"}
      onClose={handleClose}
      closeOnBackdrop={false}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isSending}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} disabled={isSending}>
            {isSending ? "Salvando…" : "Salvar"}
          </Button>
        </>
      }
    >
      {mutation.isError && !nomeRepetido && <ErrorBanner role="alert">{mutation.error.message}</ErrorBanner>}
      <Form
        id={formId}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
      >
        <form.AppField name="nome" listeners={{ onChange: () => mutation.reset() }}>
          {(field) => (
            <field.TextField
              label="Nome"
              autoFocus
              autoComplete="off"
              maxLength={NOME_MAX}
              placeholder="Ex.: Aluguel, Salários, Manutenção"
              hint={nomeRepetido ? mutation.error.message : undefined}
              hintTone={nomeRepetido ? "danger" : "muted"}
              disabled={isSending}
            />
          )}
        </form.AppField>
        <form.AppField
          name="tipo"
          listeners={{
            // Os pais são do mesmo tipo: trocar o tipo desfaz o vínculo escolhido.
            onChange: () => {
              form.setFieldValue("financeiroCategoriaPaiId", "");
              mutation.reset();
            },
          }}
        >
          {(field) => <field.OptionField legend="Tipo" options={TIPOS} disabled={isSending || isEdit} />}
        </form.AppField>
        {isEdit && <p role="note">O tipo não muda depois de criado.</p>}
        <form.AppField name="financeiroCategoriaPaiId" listeners={{ onChange: () => mutation.reset() }}>
          {(field) => (
            <field.SelectField label="Categoria pai" disabled={isSending || agrupa}>
              <option value="">Nenhuma (categoria principal)</option>
              {pais.map((pai) => (
                <option key={pai.financeiroCategoriaId} value={pai.financeiroCategoriaId}>
                  {pai.nome}
                </option>
              ))}
              {paiInativo && (
                <option value={paiInativo.financeiroCategoriaId}>{paiInativo.nome} (inativa)</option>
              )}
            </field.SelectField>
          )}
        </form.AppField>
        {agrupa && <p role="note">Esta categoria agrupa outras e não pode virar subcategoria.</p>}
        {isEdit && (
          <form.AppField name="ativo">
            {(field) => <field.SwitchField label={`Categoria ${ativa ? "ativa" : "inativa"}`} disabled={isSending} />}
          </form.AppField>
        )}
        {isEdit && !ativa && (
          <p role="note">Não recebe lançamentos novos. Os lançamentos antigos continuam valendo.</p>
        )}
      </Form>
      {confirmingClose && (
        <ConfirmDialog
          title="Descartar alterações?"
          message="Os dados preenchidos serão perdidos e nada será salvo."
          confirmLabel="Descartar"
          cancelLabel="Continuar editando"
          onConfirm={onClose}
          onCancel={() => setConfirmingClose(false)}
        />
      )}
    </Modal>
  );
}
