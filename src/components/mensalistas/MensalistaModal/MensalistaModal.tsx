"use client";

import { useStore } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useAppForm, zodFieldErrors } from "@/components/form";
import { LeitorPlacaModal } from "@/components/veiculos/LeitorPlacaModal";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Modal } from "@/components/ui/Modal";
import { OptionGroup } from "@/components/ui/OptionGroup";
import { createMensalista, updateMensalista } from "@/lib/api/services/mensalista";
import { fromMensalista } from "@/lib/api/services/mensalista.mapper";
import { formatDocumento } from "@/lib/documento";
import { formatPhone } from "@/lib/phone";
import { createMensalistaSchema } from "@/lib/schemas/mensalista";
import {
  TIPO_PESSOA,
  type Mensalista,
  type MensalistaFormValues,
  type MensalistaTipo,
  type TipoPessoa,
} from "@/types/mensalista";
import type { TipoCategoria } from "@/types/preco";
import { formatCategoria, formatValor } from "../format";
import { SituacaoMensalista } from "../SituacaoMensalista";
import { derivarSituacao, precisaDoContrato } from "../situacao";
import { useContratoMensalista } from "../useContratosMensalistas";
import { MENSALISTAS_QUERY_KEY, useTiposMensalidade } from "../useTiposMensalidade";
import { ajustarCategorias, EMPTY_MENSALISTA_VALUES, novoCondutor } from "./mensalistaForm";
import { FieldRow, Form, Note } from "./MensalistaModal.styles";
import { mapMensalistaServerError } from "./serverErrors";
import { SectionTitle } from "./Veiculos.styles";
import { VeiculosSection } from "./VeiculosSection";
import { TECLADO_INTEIRO } from "@/lib/teclado/tipos";

export interface MensalistaModalProps {
  // Presente => edição.
  mensalista?: Mensalista;
  onClose: () => void;
  onSuccess: (message: string) => void;
  // Sem tipo ativo não há como cadastrar: leva o usuário à aba de tipos.
  onGoToTipos?: () => void;
}

const PESSOA_OPTIONS = [
  { value: String(TIPO_PESSOA.Fisica), label: "Pessoa física" },
  { value: String(TIPO_PESSOA.Juridica), label: "Pessoa jurídica" },
];

function tipoLabel(tipo: MensalistaTipo): string {
  const base = `${tipo.tipoMensal} · ${formatCategoria(tipo.categoria)} · ${formatValor(tipo.valorMensalidade)}`;
  return tipo.ativo ? base : `${base} (inativo)`;
}

// Mensalista inativo: o switch não ativa ninguém (a ativação é pelo primeiro pagamento), então mostra só onde ele está.
function SituacaoSomenteLeitura({ mensalista }: { mensalista: Mensalista }) {
  const dependeDoContrato = precisaDoContrato(mensalista);
  const contrato = useContratoMensalista(mensalista.mensalistaId, dependeDoContrato);
  const situacao = derivarSituacao(mensalista, dependeDoContrato ? contrato : undefined, new Date());
  return <SituacaoMensalista situacao={situacao} nome={mensalista.nome} somenteLeitura />;
}

function categoriaDoTipoSelecionado(tipos: MensalistaTipo[] | undefined, tipoId: string): TipoCategoria | null {
  return tipos?.find((tipo) => String(tipo.mensalistaTipoId) === tipoId)?.categoria ?? null;
}

export function MensalistaModal({ mensalista, onClose, onSuccess, onGoToTipos }: MensalistaModalProps) {
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const queryClient = useQueryClient();
  const isEdit = Boolean(mensalista);
  const initialValues = useMemo(
    () => (mensalista ? fromMensalista(mensalista) : EMPTY_MENSALISTA_VALUES),
    [mensalista],
  );
  const [confirmingClose, setConfirmingClose] = useState(false);
  // Índice do veículo cuja placa está sendo lida pela câmera (um único leitor para todos).
  const [leitorIndex, setLeitorIndex] = useState<number | null>(null);
  const [notaCategorias, setNotaCategorias] = useState<string | null>(null);
  // A mensagem do back citou a placa de um veículo: o erro vai para o campo dele, não para o banner.
  const [erroNoCampo, setErroNoCampo] = useState(false);
  const [revelar, setRevelar] = useState<{ uid: string; vez: number } | null>(null);
  const { data: tipos } = useTiposMensalidade();

  // Cadastro: só tipos ativos. Edição: também o tipo atual, mesmo que tenha sido desativado.
  const tipoOptions = useMemo(
    () =>
      (tipos ?? []).filter(
        (tipo) => tipo.ativo || (mensalista !== undefined && tipo.mensalistaTipoId === mensalista.mensalistaTipoId),
      ),
    [tipos, mensalista],
  );
  const semTipoAtivo = !isEdit && tipos !== undefined && !tipos.some((tipo) => tipo.ativo);

  const mutation = useMutation({
    mutationFn: async (values: MensalistaFormValues) => {
      if (mensalista) {
        await updateMensalista(mensalista.mensalistaId, values);
      } else {
        // Nasce inativo: a ativação acontece no primeiro pagamento.
        await createMensalista({ ...values, ativo: false });
      }
    },
    onMutate: () => setErroNoCampo(false),
    onSuccess: async (_data, values) => {
      await queryClient.invalidateQueries({ queryKey: MENSALISTAS_QUERY_KEY });
      onSuccess(
        isEdit ? "Mensalista atualizado." : `Mensalista cadastrado. Enviamos o contrato para ${values.email.trim()}.`,
      );
      onClose();
    },
    onError: (error, values) => {
      const alvo = mapMensalistaServerError(error.message, values.veiculos);
      if (!alvo) {
        return;
      }
      form.setFieldMeta(`veiculos[${alvo.index}].placa`, (meta) => ({
        ...meta,
        isTouched: true,
        errorMap: { ...meta.errorMap, onServer: error.message },
      }));
      setErroNoCampo(true);
      // `vez` muda a cada erro, para reabrir o veículo mesmo que o erro seja no mesmo de antes.
      setRevelar((atual) => ({ uid: values.veiculos[alvo.index].uid, vez: (atual?.vez ?? 0) + 1 }));
    },
  });

  const form = useAppForm({
    defaultValues: initialValues,
    validators: {
      onChange: ({ value }) => {
        // A regra de categoria do veículo depende do tipo escolhido.
        const schema = createMensalistaSchema({ categoriaTipo: categoriaDoTipoSelecionado(tipos, value.mensalistaTipoId) });
        const result = schema.safeParse(value);
        return result.success ? undefined : zodFieldErrors(result);
      },
    },
    onSubmit: ({ value }) => mutation.mutate(value),
  });

  const values = useStore(form.store, (state) => state.values);
  const tentativas = useStore(form.store, (state) => state.submissionAttempts);
  const pessoa = Number(values.tipoPessoa) as TipoPessoa;
  const isJuridica = pessoa === TIPO_PESSOA.Juridica;
  const categoriaTipo = categoriaDoTipoSelecionado(tipos, values.mensalistaTipoId);
  const hasChanges = JSON.stringify(values) !== JSON.stringify(initialValues);
  const isSending = mutation.isPending;

  // Tentou salvar com erros: depois que a seção de veículos abre os itens com problema (um frame depois da
  // validação), o foco vai ao primeiro campo inválido.
  useEffect(() => {
    if (tentativas === 0) {
      return;
    }
    let segundo = 0;
    const primeiro = requestAnimationFrame(() => {
      segundo = requestAnimationFrame(() => {
        if (!form.state.isValid) {
          formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
        }
      });
    });
    return () => {
      cancelAnimationFrame(primeiro);
      cancelAnimationFrame(segundo);
    };
  }, [tentativas, form]);

  function handleTipoChange(tipoId: string) {
    mutation.reset();
    const categoria = categoriaDoTipoSelecionado(tipos, tipoId);
    const ajuste = ajustarCategorias(form.state.values.veiculos, categoria);
    if (ajuste.alterou && categoria !== null) {
      form.setFieldValue("veiculos", ajuste.veiculos);
      setNotaCategorias(`Categorias dos veículos ajustadas para ${formatCategoria(categoria)}.`);
    } else {
      setNotaCategorias(null);
    }
  }

  function handlePessoaChange(tipoPessoa: string) {
    // Trocar a pessoa muda a máscara: o documento digitado deixa de valer.
    form.setFieldValue("documento", "");
    // Condutores só existem para pessoa jurídica, e ela exige ao menos um por veículo.
    const juridica = Number(tipoPessoa) === TIPO_PESSOA.Juridica;
    form.setFieldValue(
      "veiculos",
      form.state.values.veiculos.map((veiculo) => ({
        ...veiculo,
        condutores: juridica ? (veiculo.condutores.length > 0 ? veiculo.condutores : [novoCondutor()]) : [],
      })),
    );
  }

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
      title={isEdit ? "Editar mensalista" : "Novo mensalista"}
      onClose={handleClose}
      closeOnBackdrop={false}
      size="lg"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isSending}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} disabled={isSending || semTipoAtivo}>
            {isSending ? "Salvando…" : "Salvar"}
          </Button>
        </>
      }
    >
      {mutation.isError && !erroNoCampo && <ErrorBanner role="alert">{mutation.error.message}</ErrorBanner>}
      {semTipoAtivo && (
        <Note role="status">
          <span>Crie um tipo de mensalidade antes de cadastrar mensalistas.</span>
          {onGoToTipos && (
            <Button type="button" variant="secondary" onClick={onGoToTipos}>
              Criar tipo
            </Button>
          )}
        </Note>
      )}
      <Form
        id={formId}
        ref={formRef}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
      >
        <SectionTitle>Dados do mensalista</SectionTitle>
        <form.AppField name="mensalistaTipoId" listeners={{ onChange: ({ value }) => handleTipoChange(value) }}>
          {(field) => (
            <field.SelectField label="Tipo de mensalidade" disabled={isSending || semTipoAtivo}>
              <option value="">Selecione</option>
              {tipoOptions.map((tipo) => (
                <option key={tipo.mensalistaTipoId} value={tipo.mensalistaTipoId}>
                  {tipoLabel(tipo)}
                </option>
              ))}
            </field.SelectField>
          )}
        </form.AppField>

        <form.AppField name="tipoPessoa" listeners={{ onChange: ({ value }) => handlePessoaChange(value) }}>
          {(field) => (
            <OptionGroup
              legend="Tipo de pessoa"
              options={PESSOA_OPTIONS}
              value={field.state.value}
              onChange={(value) => field.handleChange(value)}
              disabled={isSending || isEdit}
            />
          )}
        </form.AppField>

        <FieldRow>
          <form.AppField name="documento">
            {(field) => (
              <field.TextField
                label={isJuridica ? "CNPJ" : "CPF"}
                format={(value) => formatDocumento(value, pessoa)}
                autoComplete="off"
                inputMode={isJuridica ? "text" : "numeric"}
                disabled={isSending || isEdit}
              />
            )}
          </form.AppField>
          <form.AppField name="nome">
            {(field) => (
              <field.TextField
                label={isJuridica ? "Razão social" : "Nome"}
                autoComplete="off"
                maxLength={150}
                disabled={isSending}
              />
            )}
          </form.AppField>
        </FieldRow>

        <FieldRow>
          <form.AppField name="email">
            {(field) => (
              <field.TextField label="E-mail" type="email" autoComplete="off" maxLength={150} disabled={isSending} />
            )}
          </form.AppField>
          <form.AppField name="celular">
            {(field) => (
              <field.TextField
                label="Celular"
                format={formatPhone}
                inputMode="tel"
                autoComplete="off"
                placeholder="(00) 90000-0000"
                disabled={isSending}
              />
            )}
          </form.AppField>
        </FieldRow>

        <form.AppField name="diaVencimento">
          {(field) => (
            <field.TextField
              label="Dia de vencimento"
              format={(value) => value.replace(/\D/g, "").slice(0, 2)}
              inputMode="numeric"
              teclado={TECLADO_INTEIRO}
              autoComplete="off"
              hint="Dia do mês em que a mensalidade vence (1 a 31)."
              disabled={isSending}
            />
          )}
        </form.AppField>

        {mensalista?.ativo && (
          // Só desliga: o back não ativa um mensalista por aqui.
          <form.AppField name="ativo">
            {(field) => (
              <field.SwitchField
                label={values.ativo ? "Mensalista ativo" : "Mensalista será desativado ao salvar"}
                disabled={isSending}
              />
            )}
          </form.AppField>
        )}
        {mensalista && !mensalista.ativo && (
          <>
            <SectionTitle>Situação</SectionTitle>
            <SituacaoSomenteLeitura mensalista={mensalista} />
          </>
        )}

        {notaCategorias && <Note role="status">{notaCategorias}</Note>}
        <VeiculosSection
          form={form}
          juridica={isJuridica}
          categoriaTipo={categoriaTipo}
          disabled={isSending}
          onLerPlaca={setLeitorIndex}
          revelar={revelar}
        />
      </Form>
      <LeitorPlacaModal
        open={leitorIndex !== null}
        onClose={() => setLeitorIndex(null)}
        onConfirm={(placa) => {
          if (leitorIndex !== null) {
            form.setFieldValue(`veiculos[${leitorIndex}].placa`, placa);
          }
          setLeitorIndex(null);
        }}
      />
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
