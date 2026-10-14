"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useId, useRef, useState } from "react";
import { EMPRESA_QUERY_KEY } from "@/components/empresa/MinhaEmpresa/EmpresaForm";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Modal } from "@/components/ui/Modal";
import { Stepper } from "@/components/ui/Stepper";
import { getEmpresa } from "@/lib/api/services/empresa";
import { consultarSaida, registrarSaida } from "@/lib/api/services/patio";
import { parseMoney } from "@/lib/money";
import { saidaBuscaSchema, toSaidaBusca, type SaidaBuscaValues } from "@/lib/schemas/saida";
import type { SaidaBusca, SaidaConsulta } from "@/types/saida";
import { ConferirSaidaStep } from "../ConferirSaidaStep/ConferirSaidaStep";
import { ConsultaSaidaStep, type SaidaBuscaField } from "../ConsultaSaidaStep/ConsultaSaidaStep";
import {
  FORMA_DINHEIRO,
  getPagamentoStatus,
  PagamentoSaidaStep,
} from "../PagamentoSaidaStep/PagamentoSaidaStep";
import { ReciboSaidaStep, type SaidaResultado } from "../ReciboSaidaStep/ReciboSaidaStep";
import { calcularTroco, valoresIguais } from "../saida";
import { StepDescription } from "../Saida.styles";

export interface SaidaVeiculoModalProps {
  onClose: () => void;
  onSuccess: (message: string) => void;
}

type Step = 1 | 2 | 3 | 4;

const STEPS = ["Consultar", "Conferir", "Pagamento", "Recibo"];
const STEP_TITLES: Record<Step, string> = {
  1: "Consultar valores",
  2: "Conferir dados",
  3: "Pagamento",
  4: "Recibo",
};

const EMPTY_BUSCA: SaidaBuscaValues = { placa: "", codigoTicket: "", sequencial: "" };

type ConfirmInput = { busca: SaidaBusca; consulta: SaidaConsulta; forma: string; recebido: string };
type ConfirmResult =
  | { tipo: "mudou"; nova: SaidaConsulta }
  | { tipo: "registrada"; resultado: SaidaResultado };

export function SaidaVeiculoModal({ onClose, onSuccess }: SaidaVeiculoModalProps) {
  const consultaFormId = useId();
  const pagamentoFormId = useId();
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const mountedRef = useRef(false);

  const [step, setStep] = useState<Step>(1);
  const [buscaValues, setBuscaValues] = useState<SaidaBuscaValues>(EMPTY_BUSCA);
  const [buscaErrors, setBuscaErrors] = useState<Partial<Record<SaidaBuscaField, string>>>({});
  const [busca, setBusca] = useState<SaidaBusca | null>(null);
  const [consulta, setConsulta] = useState<SaidaConsulta | null>(null);
  const [valorAnterior, setValorAnterior] = useState<number | null>(null);
  const [forma, setForma] = useState("");
  const [recebido, setRecebido] = useState("");
  const [resultado, setResultado] = useState<SaidaResultado | null>(null);

  // Pré-carrega os dados da empresa para o recibo já nascer completo (falha não bloqueia).
  useQuery({
    queryKey: EMPRESA_QUERY_KEY,
    queryFn: getEmpresa,
    enabled: step >= 3,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const consultaMutation = useMutation({
    mutationFn: consultarSaida,
    onSuccess: (data, variables) => {
      setBusca(variables);
      setConsulta(data);
      setValorAnterior(null);
      setForma("");
      setRecebido("");
      setStep(2);
    },
  });

  // Reconsulta antes de registrar: se o valor mudou, nada é registrado até o operador confirmar de novo.
  const confirmMutation = useMutation({
    mutationFn: async (input: ConfirmInput): Promise<ConfirmResult> => {
      const nova = await consultarSaida(input.busca);
      if (!valoresIguais(nova.valor, input.consulta.valor)) {
        return { tipo: "mudou", nova };
      }
      // [A CONFIRMAR] O backend pode recusar valor divergente do calculado; a mensagem aparece na etapa de pagamento.
      const saida = await registrarSaida(input.consulta.patioId, {
        valor: input.consulta.valor,
        formaPagamento: Number(input.forma),
      });
      const emDinheiro = input.forma === FORMA_DINHEIRO;
      const valorRecebido = emDinheiro ? parseMoney(input.recebido) : null;
      return {
        tipo: "registrada",
        resultado: {
          saida,
          recebido: valorRecebido,
          troco: valorRecebido === null ? null : calcularTroco(valorRecebido, saida.valor),
          emitidoEm: new Date().toISOString(),
        },
      };
    },
    onSuccess: (data, variables) => {
      if (data.tipo === "mudou") {
        setValorAnterior(variables.consulta.valor);
        setConsulta(data.nova);
        return;
      }
      setResultado(data.resultado);
      setStep(4);
    },
  });

  const isBusy = consultaMutation.isPending || confirmMutation.isPending;

  // A cada troca de etapa o foco vai para a descrição, que é anunciada pelo leitor de tela.
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    descriptionRef.current?.focus();
  }, [step]);

  const [confirmingClose, setConfirmingClose] = useState(false);
  // Há saída em andamento enquanto algo foi digitado ou um veículo já foi consultado (etapas 1 a 3).
  const hasProgress = step < 4 && (consulta !== null || Object.values(buscaValues).some((value) => value !== ""));

  function handleClose() {
    if (isBusy) {
      return;
    }
    if (hasProgress) {
      setConfirmingClose(true);
      return;
    }
    onClose();
  }

  // O aviso aparece ao concluir: com o modal aberto ele ficaria atrás do fundo do diálogo.
  function handleConcluir() {
    onSuccess("Saída realizada com sucesso.");
    onClose();
  }

  function handleBuscaChange(field: SaidaBuscaField, value: string) {
    setBuscaValues((current) => ({ ...current, [field]: value }));
    setBuscaErrors((current) => ({ ...current, [field]: undefined }));
  }

  function handleConsultar() {
    const result = saidaBuscaSchema.safeParse(buscaValues);
    if (!result.success) {
      const errors: Partial<Record<SaidaBuscaField, string>> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as SaidaBuscaField;
        errors[field] ??= issue.message;
      }
      setBuscaErrors(errors);
      return;
    }
    setBuscaErrors({});
    consultaMutation.mutate(toSaidaBusca(result.data));
  }

  function handleConfirmar() {
    if (!busca || !consulta) {
      return;
    }
    confirmMutation.reset();
    confirmMutation.mutate({ busca, consulta, forma, recebido });
  }

  function goTo(next: Step) {
    consultaMutation.reset();
    confirmMutation.reset();
    setStep(next);
  }

  const pagamento = consulta ? getPagamentoStatus(forma, recebido, consulta.valor) : null;

  let footer: React.ReactNode;
  if (step === 1) {
    footer = (
      <>
        <Button type="button" variant="secondary" onClick={handleClose} disabled={isBusy}>
          Cancelar
        </Button>
        <Button type="submit" form={consultaFormId} disabled={isBusy}>
          {consultaMutation.isPending ? "Consultando..." : "Consultar valor"}
        </Button>
      </>
    );
  } else if (step === 2) {
    footer = (
      <>
        <Button type="button" variant="secondary" onClick={() => goTo(1)}>
          Voltar
        </Button>
        <Button type="button" onClick={() => goTo(3)}>
          Ir para o pagamento
        </Button>
      </>
    );
  } else if (step === 3) {
    footer = (
      <>
        <Button type="button" variant="secondary" onClick={() => goTo(2)} disabled={isBusy}>
          Voltar
        </Button>
        <Button type="submit" form={pagamentoFormId} disabled={isBusy || !pagamento?.canConfirm}>
          {confirmMutation.isPending
            ? "Registrando..."
            : valorAnterior !== null
              ? "Confirmar novo valor"
              : "Confirmar pagamento"}
        </Button>
      </>
    );
  }

  return (
    <Modal open title="Registrar saída" size="lg" closeOnBackdrop={false} onClose={step === 4 ? handleConcluir : handleClose} footer={footer}>
      <Stepper steps={STEPS} currentStep={step} label="Progresso da saída" />
      <StepDescription ref={descriptionRef} tabIndex={-1}>
        Etapa {step} de 4: {STEP_TITLES[step]}
      </StepDescription>

      {step === 1 && (
        <ConsultaSaidaStep
          formId={consultaFormId}
          values={buscaValues}
          errors={buscaErrors}
          onChange={handleBuscaChange}
          onSubmit={handleConsultar}
          isPending={consultaMutation.isPending}
          error={consultaMutation.isError ? consultaMutation.error.message : undefined}
        />
      )}
      {step === 2 && consulta && <ConferirSaidaStep consulta={consulta} />}
      {step === 3 && consulta && (
        <PagamentoSaidaStep
          formId={pagamentoFormId}
          consulta={consulta}
          valorAnterior={valorAnterior}
          forma={forma}
          recebido={recebido}
          onFormaChange={setForma}
          onRecebidoChange={setRecebido}
          onSubmit={handleConfirmar}
          isPending={confirmMutation.isPending}
          error={confirmMutation.isError ? confirmMutation.error.message : undefined}
        />
      )}
      {step === 4 && consulta && resultado && (
        <ReciboSaidaStep consulta={consulta} resultado={resultado} onConcluir={handleConcluir} />
      )}
      {confirmingClose && (
        <ConfirmDialog
          title="Cancelar a saída?"
          message="A saída em andamento será descartada e nada será registrado."
          confirmLabel="Descartar"
          cancelLabel="Continuar saída"
          onConfirm={onClose}
          onCancel={() => setConfirmingClose(false)}
        />
      )}
    </Modal>
  );
}
