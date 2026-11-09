"use client";

import { useStore } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ZodType } from "zod";
import { useEffect, useId, useMemo, useRef } from "react";
import { useConfiguracao } from "@/components/configuracoes/useConfiguracao";
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
  criarEntradaConferenciaSchema,
  entradaConferenciaSchema,
  MODELO_MAX,
  toEntradaConferenciaPayload,
  type EntradaConferenciaValues,
} from "@/lib/schemas/conferenciaPatio";
import { PRISMA_INTERVALO_MESSAGE, prismaDoTexto } from "@/lib/prisma";
import { prismaExigido } from "@/lib/schemas/regrasEntrada";
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

export function RegistrarEntradaConferenciaModal({ conferenciaId, placa, onClose, onRegistrada }: RegistrarEntradaConferenciaModalProps) {
  const formId = useId();
  const pendenciaId = useId();
  const queryClient = useQueryClient();
  const { data: modelos = [] } = useModelos();
  const { configuracao } = useConfiguracao();

  const mutation = useMutation({
    // Campo que a empresa não exige não aparece no formulário e não vai.
    mutationFn: (values: EntradaConferenciaValues) =>
      registrarEntradaSemTicket(
        conferenciaId,
        placa,
        toEntradaConferenciaPayload({ ...values, modelo: exigeModelo ? values.modelo : "", cor: exigeCor ? values.cor : "" }),
      ),
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

  // Os validadores do formulário leem o schema da vez (a configuração chega depois da abertura).
  const schemaRef = useRef<ZodType<EntradaConferenciaValues>>(entradaConferenciaSchema);

  const form = useAppForm({
    defaultValues: { categoria: "", modelo: "", cor: "", prisma: "", codigoTicket: "", mensalista: false } as EntradaConferenciaValues,
    validators: {
      onChange: ({ value }) => {
        const result = schemaRef.current.safeParse(value);
        return result.success ? undefined : zodFieldErrors(result);
      },
    },
    // Só chega aqui com o schema satisfeito.
    onSubmit: ({ value }) => mutation.mutate(schemaRef.current.parse(value)),
  });

  const categoria = useStore(form.store, ({ values }) => values.categoria);
  const modelo = useStore(form.store, ({ values }) => values.modelo);
  const cor = useStore(form.store, ({ values }) => values.cor);
  const prisma = useStore(form.store, ({ values }) => values.prisma);
  const codigoTicket = useStore(form.store, ({ values }) => values.codigoTicket);
  const mensalista = useStore(form.store, ({ values }) => values.mensalista);
  const enviando = mutation.isPending;

  // O que a empresa exige. O prisma não vale para mensalista, que pode entrar sem ele.
  const { modelo: exigeModelo, cor: exigeCor, prisma: exigePrismaDaEmpresa } = configuracao;
  const regras = useMemo(
    () => ({ modelo: exigeModelo, cor: exigeCor, prisma: exigePrismaDaEmpresa, mensalista }),
    [exigeModelo, exigeCor, exigePrismaDaEmpresa, mensalista],
  );
  useEffect(() => {
    schemaRef.current = criarEntradaConferenciaSchema(regras);
  }, [regras]);
  const exigePrisma = prismaExigido(regras);

  const faltando = [
    exigeModelo && modelo.trim() === "" && "modelo",
    !CATEGORIAS.includes(categoria) && "categoria",
    exigeCor && cor === "" && "cor",
    exigePrisma && prisma.trim() === "" && "prisma",
  ].filter((item): item is string => item !== false);
  const prismaInvalido = exigePrisma && prisma.trim() !== "" && prismaDoTexto(prisma) === null;
  const ticketInvalido = codigoTicket !== "" && !/^\d{1,9}$/.test(codigoTicket);
  const pendencia = faltando.length > 0 ? `Falta: ${faltando.join(", ").replace(/,([^,]*)$/, " e$1")}.` : prismaInvalido ? `${PRISMA_INTERVALO_MESSAGE}.` : ticketInvalido ? "Use só números no código do ticket." : null;

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
        {exigeModelo && (
          <form.AppField name="modelo" listeners={{ onChange: ({ value }) => handleModeloChange(value) }}>
            {() => <ModeloField maxLength={MODELO_MAX} disabled={enviando} required data-autofocus="" />}
          </form.AppField>
        )}
        <form.AppField name="categoria">
          {(field) => <field.OptionField legend="Categoria (define a tarifa)" options={CATEGORIA_OPTIONS} disabled={enviando} />}
        </form.AppField>
        {exigeCor && (
          <form.AppField name="cor">
            {(field) => <field.ColorField legend="Cor" options={CORES_VEICULO} disabled={enviando} />}
          </form.AppField>
        )}
        {exigePrisma && (
          <form.AppField name="prisma">
            {(field) => <field.PrismaField disabled={enviando} />}
          </form.AppField>
        )}
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
