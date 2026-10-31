"use client";

import { useStore } from "@tanstack/react-form";
import { useId, useState } from "react";
import { formaPagamentoLabel } from "@/components/caixa/format";
import { useAppForm, zodFieldErrors } from "@/components/form";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { InfoCard } from "@/components/ui/InfoCard";
import { Modal } from "@/components/ui/Modal";
import { formatBRL, maskMoney, parseMoney } from "@/lib/money";
import { formatDataInput } from "@/lib/periodo";
import { createLancamentoSchema } from "@/lib/schemas/financeiro";
import { FORMA_PAGAMENTO, FORMA_PAGAMENTO_OPTIONS } from "@/types/caixa";
import { TIPO_LANCAMENTO, type Lancamento, type LancamentoFormValues, type TipoLancamento } from "@/types/financeiro";
import { opcoesDeCategoria, tipoDoLancamento, tipoPorCategoria } from "../categorias";
import { excedeDisponivel, estadoPelaGaveta } from "../pelaGaveta";
import { useCategorias } from "../useCategorias";
import { useLancamentoMutations } from "../useLancamentoMutations";
import { useTurnoParaLancamento } from "../useTurnoParaLancamento";
import { Aviso, FieldRow, Form, PeloCaixa } from "./LancamentoModal.styles";
import { TECLADO_ALFA, TECLADO_DECIMAL } from "@/lib/teclado/tipos";

export interface LancamentoFormProps {
  // Presente => edição.
  lancamento?: Lancamento;
  tipoInicial?: TipoLancamento;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onCancelar: (lancamento: Lancamento) => void;
  onCriarCategoria: () => void;
}

const DESCRICAO_MAX = 200;

const TIPOS = [
  { value: String(TIPO_LANCAMENTO.Entrada), label: "Entrada" },
  { value: String(TIPO_LANCAMENTO.Saida), label: "Saída" },
];

function valoresIniciais(hoje: string, tipoInicial: TipoLancamento | undefined, lancamento: Lancamento | undefined, tipoDoLancamentoAtual: TipoLancamento | null): LancamentoFormValues {
  if (!lancamento) {
    return {
      // Despesa é o que mais se lança.
      tipo: String(tipoInicial ?? TIPO_LANCAMENTO.Saida),
      financeiroCategoriaId: "",
      descricao: "",
      valor: "",
      dataPagamento: hoje,
      formaPagamento: String(FORMA_PAGAMENTO.Dinheiro),
      favorecido: "",
      documento: "",
      observacao: "",
      peloCaixa: false,
    };
  }
  return {
    tipo: String(tipoDoLancamentoAtual ?? TIPO_LANCAMENTO.Saida),
    financeiroCategoriaId: String(lancamento.financeiroCategoriaId),
    descricao: lancamento.descricao,
    valor: maskMoney(lancamento.valor.toFixed(2).replace(".", ",")),
    dataPagamento: lancamento.dataPagamento,
    formaPagamento: String(lancamento.formaPagamento),
    favorecido: lancamento.favorecido ?? "",
    documento: lancamento.documento ?? "",
    observacao: lancamento.observacao ?? "",
    // O "pelo caixa" só vale no cadastro; na edição o back o ignora.
    peloCaixa: false,
  };
}

export function LancamentoForm({ lancamento, tipoInicial, onClose, onSuccess, onCancelar, onCriarCategoria }: LancamentoFormProps) {
  const formId = useId();
  const avisoId = useId();
  const isEdit = Boolean(lancamento);
  const [hoje] = useState(() => formatDataInput(new Date()));
  const [confirmingClose, setConfirmingClose] = useState(false);
  const categoriasQuery = useCategorias();
  const categorias = categoriasQuery.data ?? [];
  const { criar, editar } = useLancamentoMutations();
  const mutation = isEdit ? editar : criar;
  // O turno só interessa no cadastro: é de lá que o lançamento pode sair pela gaveta.
  const turnoQuery = useTurnoParaLancamento(!isEdit);

  const schema = createLancamentoSchema({ hoje });
  const tipoAtual = lancamento ? tipoDoLancamento(lancamento, tipoPorCategoria(categorias)) : null;
  const initialValues = valoresIniciais(hoje, tipoInicial, lancamento, tipoAtual);
  // Lançamento feito pelo caixa: valor, data e forma não mudam (o back recusa); só cancelar e lançar de novo.
  const travado = lancamento?.peloCaixa === true;

  const form = useAppForm({
    defaultValues: initialValues,
    validators: {
      onChange: ({ value }) => {
        const result = schema.safeParse(value);
        const erros: Record<string, string> = result.success ? {} : (zodFieldErrors(result)?.fields ?? {});
        const estado = estadoPelaGaveta({
          formaPagamento: value.formaPagamento,
          dataPagamento: value.dataPagamento,
          hoje,
          turno: turnoQuery.turno,
          turnoCarregando: turnoQuery.carregando,
          turnoSemPermissao: turnoQuery.semPermissao,
        });
        if (!erros.valor && !isEdit && value.peloCaixa && excedeDisponivel({ tipo: Number(value.tipo) as TipoLancamento, valor: parseMoney(value.valor), disponivel: estado.disponivel })) {
          erros.valor = `Maior que o dinheiro na gaveta (${formatBRL(estado.disponivel ?? 0)}).`;
        }
        return Object.keys(erros).length > 0 ? { fields: erros } : undefined;
      },
    },
    onSubmit: ({ value }) => {
      const concluir = () => {
        onSuccess(isEdit ? "Lançamento atualizado." : "Lançamento salvo.");
        onClose();
      };
      if (lancamento) {
        editar.mutate({ id: lancamento.financeiroLancamentoId, values: value, atual: lancamento }, { onSuccess: concluir });
      } else {
        criar.mutate(value, { onSuccess: concluir });
      }
    },
  });

  const values = useStore(form.store, (state) => state.values);
  const hasChanges = JSON.stringify(values) !== JSON.stringify(initialValues);
  const tipo = Number(values.tipo) as TipoLancamento;
  const isEntrada = tipo === TIPO_LANCAMENTO.Entrada;
  const isSending = mutation.isPending;

  const opcoes = opcoesDeCategoria(categorias, { tipo, manterId: lancamento?.financeiroCategoriaId });
  const semCategorias = categoriasQuery.isSuccess && opcoes.length === 0;

  const gaveta = estadoPelaGaveta({
    formaPagamento: values.formaPagamento,
    dataPagamento: values.dataPagamento,
    hoje,
    turno: turnoQuery.turno,
    turnoCarregando: turnoQuery.carregando,
    turnoSemPermissao: turnoQuery.semPermissao,
  });

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
      size="lg"
      title={isEdit ? "Editar lançamento" : "Novo lançamento"}
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
      {mutation.isError && <ErrorBanner role="alert">{mutation.error.message}</ErrorBanner>}
      {lancamento && travado && (
        <Aviso>
          <InfoCard title="Lançado pelo caixa">Para mudar valor, data ou forma de pagamento, cancele e lance de novo.</InfoCard>
          <Button type="button" variant="danger" size="sm" onClick={() => onCancelar(lancamento)} disabled={isSending}>
            Cancelar lançamento
          </Button>
        </Aviso>
      )}
      <Form
        id={formId}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
      >
        <form.AppField
          name="tipo"
          listeners={{
            // As categorias são de um tipo só: trocar o tipo desfaz a escolha.
            onChange: () => {
              form.setFieldValue("financeiroCategoriaId", "");
              mutation.reset();
            },
          }}
        >
          {(field) => <field.OptionField legend="Tipo" options={TIPOS} disabled={isSending || isEdit} />}
        </form.AppField>
        <form.AppField name="financeiroCategoriaId" listeners={{ onChange: () => mutation.reset() }}>
          {(field) => (
            <field.SelectField label="Categoria" disabled={isSending}>
              <option value="">Selecione</option>
              {opcoes.map((opcao) => (
                <option key={opcao.value} value={opcao.value}>
                  {opcao.label}
                </option>
              ))}
            </field.SelectField>
          )}
        </form.AppField>
        {semCategorias && (
          <Aviso>
            <p role="note">Não há categoria de {isEntrada ? "receita" : "despesa"} ativa.</p>
            <Button type="button" variant="secondary" size="sm" onClick={onCriarCategoria}>
              Criar categoria
            </Button>
          </Aviso>
        )}
        <form.AppField name="descricao" listeners={{ onChange: () => mutation.reset() }}>
          {(field) => <field.TextField label="Descrição" autoComplete="off" maxLength={DESCRICAO_MAX} disabled={isSending} />}
        </form.AppField>
        <FieldRow>
          <form.AppField name="valor" listeners={{ onChange: () => mutation.reset() }}>
            {(field) => (
              <field.TextField
                label="Valor (R$)"
                inputMode="decimal"
                teclado={TECLADO_DECIMAL}
                autoComplete="off"
                placeholder="R$ 0,00"
                format={maskMoney}
                disabled={isSending || travado}
              />
            )}
          </form.AppField>
          <form.AppField
            name="dataPagamento"
            listeners={{
              onChange: ({ value }) => {
                // Só vale pela gaveta com a data de hoje: outra data desliga o interruptor.
                if (value !== hoje) {
                  form.setFieldValue("peloCaixa", false);
                }
                mutation.reset();
              },
            }}
          >
            {(field) => <field.TextField label="Data do pagamento" type="date" max={hoje} disabled={isSending || travado} />}
          </form.AppField>
        </FieldRow>
        <FieldRow>
          <form.AppField
            name="formaPagamento"
            listeners={{
              onChange: ({ value }) => {
                // Só vale pela gaveta em dinheiro: outra forma desliga o interruptor.
                if (value !== String(FORMA_PAGAMENTO.Dinheiro)) {
                  form.setFieldValue("peloCaixa", false);
                }
                mutation.reset();
              },
            }}
          >
            {(field) => (
              <field.SelectField label="Forma de pagamento" disabled={isSending || travado}>
                {FORMA_PAGAMENTO_OPTIONS.map((opcao) => (
                  <option key={opcao.value} value={opcao.value}>
                    {formaPagamentoLabel(opcao.value)}
                  </option>
                ))}
              </field.SelectField>
            )}
          </form.AppField>
          <form.AppField name="favorecido">
            {(field) => <field.TextField label={isEntrada ? "Recebido de" : "Pago a"} autoComplete="off" disabled={isSending} />}
          </form.AppField>
        </FieldRow>
        <FieldRow>
          <form.AppField name="documento">
            {(field) => <field.TextField label="Documento" hint="Nota, boleto ou recibo." autoComplete="off" disabled={isSending} />}
          </form.AppField>
          <form.AppField name="observacao">
            {(field) => <field.TextField label="Observação" autoComplete="off" teclado={TECLADO_ALFA} disabled={isSending} />}
          </form.AppField>
        </FieldRow>
        {!isEdit && (
          <PeloCaixa>
            <form.AppField name="peloCaixa">
              {(field) => (
                <field.SwitchField
                  label={isEntrada ? "Entrou pela gaveta do caixa" : "Saiu da gaveta do caixa"}
                  disabled={isSending || !gaveta.habilitado}
                  aria-describedby={avisoId}
                />
              )}
            </form.AppField>
            <div id={avisoId}>
              {!gaveta.habilitado && <p role="note">{gaveta.motivo}</p>}
              {gaveta.habilitado && gaveta.aviso && !values.peloCaixa && <p role="note">{gaveta.aviso}</p>}
            </div>
            {values.peloCaixa && gaveta.habilitado && (
              <InfoCard title="Vai aparecer no turno atual e entrar na conferência do caixa.">
                {gaveta.disponivel !== null
                  ? !isEntrada && `Disponível na gaveta: ${formatBRL(gaveta.disponivel)}.`
                  : gaveta.aviso}
              </InfoCard>
            )}
          </PeloCaixa>
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
