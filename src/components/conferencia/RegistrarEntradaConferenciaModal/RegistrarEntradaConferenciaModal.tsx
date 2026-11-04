"use client";

import { useStore } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useId } from "react";
import { useAppForm, zodFieldErrors } from "@/components/form";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Modal } from "@/components/ui/Modal";
import { PlateDisplay } from "@/components/ui/PlateDisplay";
import { CategoriaIcon } from "@/components/veiculos/categoriaIcons";
import { ModeloField } from "@/components/veiculos/ModeloField";
import { useModelos } from "@/components/veiculos/useModelos";
import { ApiError } from "@/lib/api/errors";
import { registrarEntradaSemTicket } from "@/lib/api/services/conferenciaPatio";
import {
  entradaConferenciaSchema,
  MODELO_MAX,
  toEntradaConferenciaPayload,
  type EntradaConferenciaValues,
} from "@/lib/schemas/conferenciaPatio";
import { TECLADO_INTEIRO } from "@/lib/teclado/tipos";
import { CATEGORIA_VEICULO, CATEGORIA_VEICULO_OPTIONS, CORES_VEICULO } from "@/types/veiculo";
import { atualizarAposAjuste } from "../useConferenciaAcoes";
import { Form, Placa, Pendencia } from "./RegistrarEntradaConferenciaModal.styles";

export interface RegistrarEntradaConferenciaModalProps {
  conferenciaId: number;
  placa: string;
  onClose: () => void;
  onRegistrada: (mensagem: string) => void;
}

// Carros do menor para o maior, depois moto e utilitários (a mesma ordem da entrada de veículos).
const ORDEM_CATEGORIAS: number[] = [
  CATEGORIA_VEICULO.CarroPequeno,
  CATEGORIA_VEICULO.CarroMedio,
  CATEGORIA_VEICULO.CarroGrande,
  CATEGORIA_VEICULO.Moto,
  CATEGORIA_VEICULO.Caminhonete,
  CATEGORIA_VEICULO.Caminhao,
];

const CATEGORIAS = CATEGORIA_VEICULO_OPTIONS.map((option) => String(option.value));
const CATEGORIA_OPTIONS = [...CATEGORIA_VEICULO_OPTIONS]
  .sort((a, b) => ORDEM_CATEGORIAS.indexOf(a.value) - ORDEM_CATEGORIAS.indexOf(b.value))
  .map((option) => ({ value: String(option.value), label: option.label, icon: <CategoriaIcon categoria={option.value} /> }));

export const MENSAGEM_ENTRADA_REGISTRADA = "Entrada registrada.";
export const DICA_AVULSO = "Você pode registrar como avulso.";

// Enquanto ninguém escolhe, a cor do formulário fica vazia; o schema a exige antes de enviar.
type FormValues = Omit<EntradaConferenciaValues, "cor"> & { cor: EntradaConferenciaValues["cor"] | "" };

export function RegistrarEntradaConferenciaModal({ conferenciaId, placa, onClose, onRegistrada }: RegistrarEntradaConferenciaModalProps) {
  const formId = useId();
  const pendenciaId = useId();
  const queryClient = useQueryClient();
  const { data: modelos = [] } = useModelos();

  const mutation = useMutation({
    mutationFn: (values: EntradaConferenciaValues) => registrarEntradaSemTicket(conferenciaId, placa, toEntradaConferenciaPayload(values)),
    onSuccess: () => {
      atualizarAposAjuste(queryClient);
      onRegistrada(MENSAGEM_ENTRADA_REGISTRADA);
      onClose();
    },
    onError: (error, values) => {
      // O back recusou o mensalista (atraso, dia ou vaga): a escolha volta a avulso e o resto do formulário fica.
      if (values.mensalista && error instanceof ApiError && error.kind === "validation") {
        form.setFieldValue("mensalista", false);
      }
    },
  });

  const form = useAppForm({
    defaultValues: { categoria: "", modelo: "", cor: "", codigoTicket: "", mensalista: false } as FormValues,
    validators: {
      onChange: ({ value }) => {
        const result = entradaConferenciaSchema.safeParse(value);
        return result.success ? undefined : zodFieldErrors(result);
      },
    },
    // Só chega aqui com o schema satisfeito.
    onSubmit: ({ value }) => mutation.mutate(value as EntradaConferenciaValues),
  });

  const categoria = useStore(form.store, ({ values }) => values.categoria);
  const modelo = useStore(form.store, ({ values }) => values.modelo);
  const cor = useStore(form.store, ({ values }) => values.cor);
  const codigoTicket = useStore(form.store, ({ values }) => values.codigoTicket);
  const enviando = mutation.isPending;

  const faltando = [
    modelo.trim() === "" && "modelo",
    !CATEGORIAS.includes(categoria) && "categoria",
    cor === "" && "cor",
  ].filter((item): item is string => item !== false);
  const ticketInvalido = codigoTicket !== "" && !/^\d{1,9}$/.test(codigoTicket);
  const pendencia = faltando.length > 0 ? `Falta: ${faltando.join(", ").replace(/,([^,]*)$/, " e$1")}.` : ticketInvalido ? "Use só números no código do ticket." : null;

  // Escolher um modelo conhecido já sugere a categoria dele; o operador pode trocar.
  function handleModeloChange(texto: string) {
    const nome = texto.trim().toLowerCase();
    const sugestao = modelos.find((item) => item.nome.toLowerCase() === nome);
    if (sugestao && CATEGORIAS.includes(String(sugestao.categoria))) {
      form.setFieldValue("categoria", String(sugestao.categoria));
    }
  }

  const erro = mutation.error;

  return (
    <Modal
      open
      title="Registrar entrada"
      onClose={enviando ? () => undefined : onClose}
      closeOnBackdrop={false}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={enviando}>
            Depois
          </Button>
          <Button type="submit" form={formId} disabled={enviando || pendencia !== null} aria-describedby={pendencia ? pendenciaId : undefined}>
            {enviando ? "Registrando…" : "Registrar e conferir"}
          </Button>
          {pendencia && !enviando && <Pendencia id={pendenciaId}>{pendencia}</Pendencia>}
        </>
      }
    >
      <Placa>
        <PlateDisplay value={placa} />
      </Placa>

      {erro && (
        <ErrorBanner role="alert">
          <div>{erro.message}</div>
          {mutation.variables?.mensalista && erro instanceof ApiError && erro.kind === "validation" && <div>{DICA_AVULSO}</div>}
        </ErrorBanner>
      )}

      <Form
        id={formId}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
      >
        <form.AppField name="modelo" listeners={{ onChange: ({ value }) => handleModeloChange(value) }}>
          {() => <ModeloField maxLength={MODELO_MAX} disabled={enviando} required data-autofocus="" />}
        </form.AppField>
        <form.AppField name="categoria">
          {(field) => <field.OptionField legend="Categoria (define a tarifa)" options={CATEGORIA_OPTIONS} disabled={enviando} />}
        </form.AppField>
        <form.AppField name="cor">
          {(field) => <field.ColorField legend="Cor" options={CORES_VEICULO} disabled={enviando} />}
        </form.AppField>
        <form.AppField name="codigoTicket">
          {(field) => (
            <field.TextField
              label="Código do ticket (opcional)"
              inputMode="numeric"
              autoComplete="off"
              maxLength={9}
              format={(valor) => valor.replace(/\D/g, "")}
              teclado={TECLADO_INTEIRO}
              disabled={enviando}
            />
          )}
        </form.AppField>
        <form.AppField name="mensalista">
          {(field) => <field.SwitchField label="Entrar como mensalista" disabled={enviando} />}
        </form.AppField>
      </Form>
    </Modal>
  );
}
