"use client";

import { useStore } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useId, useRef, useState } from "react";
import { useAppForm, zodFieldErrors } from "@/components/form";
import { Button } from "@/components/ui/Button";
import { CameraButton } from "@/components/ui/CameraButton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Modal } from "@/components/ui/Modal";
import { registrarEntrada } from "@/lib/api/services/patio";
import { isValidPlaca, normalizePlaca } from "@/lib/placa";
import { entradaVeiculoSchema, type EntradaVeiculoValues } from "@/lib/schemas/veiculo";
import { CATEGORIA_VEICULO_OPTIONS, COR_PADRAO, CORES_VEICULO, matchCor, type EntradaRegistrada } from "@/types/veiculo";
import { CategoriaIcon } from "../categoriaIcons";
import { LeitorPlacaModal } from "../LeitorPlacaModal";
import { ReciboEntradaStep } from "../ReciboEntradaStep";
import { useModelos } from "../useModelos";
import { usePlacaLookup, type PlacaLookupStatus } from "../usePlacaLookup";
import { Form } from "./EntradaVeiculoModal.styles";

export interface EntradaVeiculoModalProps {
  onClose: () => void;
  onSuccess: (message: string) => void;
}

const CATEGORIAS = CATEGORIA_VEICULO_OPTIONS.map((option) => String(option.value));

const CATEGORIA_OPTIONS = CATEGORIA_VEICULO_OPTIONS.map((option) => ({
  value: String(option.value),
  label: option.label,
  icon: <CategoriaIcon categoria={option.value} />,
}));

function placaHint(status: PlacaLookupStatus): { hint?: string; tone?: "muted" | "success" | "danger" } {
  switch (status.state) {
    case "loading":
      return { hint: "Consultando placa…", tone: "muted" };
    case "found":
      return { hint: "Dados do cadastro preenchidos.", tone: "success" };
    case "error":
      return { hint: "Não foi possível consultar a placa. Preencha os dados manualmente.", tone: "danger" };
    default:
      return {};
  }
}

export function EntradaVeiculoModal({ onClose, onSuccess }: EntradaVeiculoModalProps) {
  const formId = useId();
  const datalistId = useId();
  const { status, lookup, reset: resetLookup } = usePlacaLookup();
  // Com a entrada registrada, o modal passa do formulário para o comprovante.
  const [entrada, setEntrada] = useState<EntradaRegistrada | null>(null);

  const mutation = useMutation({
    // O código do ticket é gerado pelo backend.
    mutationFn: (values: EntradaVeiculoValues) =>
      registrarEntrada({
        placa: normalizePlaca(values.placa),
        categoria: Number(values.categoria),
        mensalista: values.mensalista,
        // [A CONFIRMAR] modelo opcional: assume que o backend aceita texto vazio.
        modelo: values.modelo.trim(),
        cor: values.cor,
      }),
    onSuccess: (registrada) => setEntrada(registrada),
  });

  const form = useAppForm({
    defaultValues: { placa: "", categoria: "", modelo: "", cor: COR_PADRAO, mensalista: false } as EntradaVeiculoValues,
    validators: {
      onChange: ({ value }) => {
        const result = entradaVeiculoSchema.safeParse(value);
        return result.success ? undefined : zodFieldErrors(result);
      },
    },
    onSubmit: ({ value }) => mutation.mutate(value),
  });

  const modeloTexto = useStore(form.store, (state) => state.values.modelo);
  const mensalista = useStore(form.store, (state) => state.values.mensalista);
  const hasChanges = useStore(
    form.store,
    ({ values }) => values.placa !== "" || values.categoria !== "" || values.modelo !== "" || values.cor !== COR_PADRAO || values.mensalista,
  );
  // O registro só é liberado com placa válida e categoria escolhida.
  const canSubmit = useStore(
    form.store,
    ({ values }) => isValidPlaca(values.placa) && CATEGORIAS.includes(values.categoria),
  );
  const [confirmingClose, setConfirmingClose] = useState(false);
  const [leitorAberto, setLeitorAberto] = useState(false);
  const { data: modelos = [] } = useModelos(modeloTexto);

  // O listener do campo pode ser recriado a cada render; a ref garante a lista mais recente.
  const modelosRef = useRef(modelos);
  useEffect(() => {
    modelosRef.current = modelos;
  }, [modelos]);

  const isSending = mutation.isPending;

  function handleConcluir() {
    onSuccess("Entrada registrada.");
    onClose();
  }

  function handleClose() {
    // A entrada já foi registrada: fechar o comprovante não descarta nada.
    if (entrada) {
      handleConcluir();
      return;
    }
    if (isSending) {
      return;
    }
    // Com dados em andamento, pede confirmação antes de descartar.
    if (hasChanges) {
      setConfirmingClose(true);
      return;
    }
    onClose();
  }

  async function handlePlacaBlur(rawPlaca: string) {
    const placa = normalizePlaca(rawPlaca);
    if (!isValidPlaca(placa)) {
      return;
    }
    const cadastro = await lookup(placa);
    // Descarta a resposta se a placa mudou enquanto a consulta estava em andamento.
    if (!cadastro || normalizePlaca(form.getFieldValue("placa")) !== placa) {
      return;
    }
    if (cadastro.modelo) {
      form.setFieldValue("modelo", cadastro.modelo, { dontRunListeners: true });
    }
    // A cor do cadastro é texto livre: só vale se for uma das cores da lista.
    const cor = matchCor(cadastro.cor);
    if (cor) {
      form.setFieldValue("cor", cor);
    }
    if (cadastro.categoria !== null && CATEGORIAS.includes(String(cadastro.categoria))) {
      form.setFieldValue("categoria", String(cadastro.categoria));
    }
  }

  function handlePlacaLida(placa: string) {
    setLeitorAberto(false);
    // Mesmo caminho da digitação: preenche o campo e consulta o cadastro da placa, sem registrar nada.
    form.setFieldValue("placa", placa);
    void handlePlacaBlur(placa);
  }

  function handleDigitarPlaca() {
    setLeitorAberto(false);
    // O modal devolve o foco ao botão que o abriu ao fechar; o campo da placa toma o foco logo depois.
    setTimeout(() => document.getElementById(formId)?.querySelector<HTMLInputElement>('input[name="placa"]')?.focus());
  }

  function handleModeloChange(texto: string) {
    const nome = texto.trim().toLowerCase();
    const sugestao = modelosRef.current.find((modelo) => modelo.nome.toLowerCase() === nome);
    if (sugestao && CATEGORIAS.includes(String(sugestao.categoria))) {
      form.setFieldValue("categoria", String(sugestao.categoria));
    }
  }

  const { hint, tone } = placaHint(status);

  return (
    <Modal
      open
      title="Registrar entrada"
      size={entrada ? "lg" : "md"}
      onClose={handleClose}
      closeOnBackdrop={false}
      footer={
        entrada ? undefined : (
        <>
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isSending}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} disabled={isSending || !canSubmit}>
            {isSending ? "Registrando..." : "Registrar entrada"}
          </Button>
        </>
        )
      }
    >
      {entrada ? (
        <ReciboEntradaStep entrada={entrada} onConcluir={handleConcluir} />
      ) : (
        <>
      {mutation.isError && <ErrorBanner role="alert">{mutation.error.message}</ErrorBanner>}
      <Form
        id={formId}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
      >
        <form.AppField
          name="placa"
          listeners={{
            onChange: () => resetLookup(),
            onBlur: ({ value }) => void handlePlacaBlur(value),
          }}
        >
          {(field) => (
            <field.PlateField
              label="Placa"
              autoFocus
              hint={hint}
              hintTone={tone}
              disabled={isSending}
              action={<CameraButton disabled={isSending} onClick={() => setLeitorAberto(true)} />}
            />
          )}
        </form.AppField>
        <form.AppField name="modelo" listeners={{ onChange: ({ value }) => handleModeloChange(value) }}>
          {(field) => (
            <field.TextField label="Modelo" list={datalistId} autoComplete="off" maxLength={60} disabled={isSending} />
          )}
        </form.AppField>
        <form.AppField name="cor">
          {(field) => <field.ColorField legend="Cor" options={CORES_VEICULO} disabled={isSending} />}
        </form.AppField>
        <form.AppField name="categoria">
          {(field) => (
            <field.OptionField
              legend="Categoria (define a tarifa)"
              options={CATEGORIA_OPTIONS}
              disabled={isSending}
            />
          )}
        </form.AppField>
        <datalist id={datalistId}>
          {modelos.map((modelo) => (
            <option key={modelo.modeloId} value={modelo.nome} />
          ))}
        </datalist>
        <form.AppField name="mensalista">
          {(field) => (
            <field.SwitchField label={`Mensalista: ${mensalista ? "Sim" : "Não"}`} disabled={isSending} />
          )}
        </form.AppField>
      </Form>
        </>
      )}
      <LeitorPlacaModal
        open={leitorAberto}
        onClose={() => setLeitorAberto(false)}
        onConfirm={handlePlacaLida}
        onDigitar={handleDigitarPlaca}
      />
      {confirmingClose && (
        <ConfirmDialog
          title="Descartar entrada?"
          message="Os dados preenchidos serão perdidos e a entrada não será registrada."
          confirmLabel="Descartar"
          cancelLabel="Continuar editando"
          onConfirm={onClose}
          onCancel={() => setConfirmingClose(false)}
        />
      )}
    </Modal>
  );
}
