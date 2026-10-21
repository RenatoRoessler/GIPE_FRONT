"use client";

import { useStore } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { useId, useRef, useState } from "react";
import { useAppForm, zodFieldErrors } from "@/components/form";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Modal } from "@/components/ui/Modal";
import { StageTrack } from "@/components/ui/StageTrack";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { ToastVariant } from "@/components/ui/Toast";
import { listMensalistas } from "@/lib/api/services/mensalista";
import { formatBRL, parseMoney } from "@/lib/money";
import { pagamentoSchema } from "@/lib/schemas/pagamento";
import { FORMA_PAGAMENTO, FORMA_PAGAMENTO_OPTIONS } from "@/types/caixa";
import type { Mensalista, PagamentoFormValues, SituacaoMensalista } from "@/types/mensalista";
import { formatCategoria } from "../format";
import { pagamentoJaRegistrado, rotuloAtivacao, rotuloConfirmar } from "../pagamento";
import { apresentarSituacao } from "../SituacaoMensalista";
import { useReenviarContrato } from "../useReenviarContrato";
import { MENSALISTAS_QUERY_KEY } from "../useTiposMensalidade";
import { usePagamentoMensalista } from "../usePagamentoMensalista";
import { ComprovantePagamento } from "./ComprovantePagamento";
import { BadgeRow, Effect, ErrorBox, Form, Header, StatusNote, Summary } from "./PagamentoMensalistaModal.styles";

export interface PagamentoMensalistaModalProps {
  mensalista: Mensalista;
  situacao: SituacaoMensalista;
  onClose: () => void;
  onToast: (message: string, variant?: ToastVariant) => void;
}

const FORMAS = FORMA_PAGAMENTO_OPTIONS.map((option) => ({ value: String(option.value), label: option.label }));

// Conferência da situação depois de uma falha de rede: "sem-mudanca" libera um novo envio.
type Conferencia = "nao" | "conferindo" | "sem-mudanca" | "falhou";

// A mensalidade do tipo vem como valor sugerido: o operador só troca se o valor recebido for outro.
function valorSugerido(valorMensalidade: number): string {
  return valorMensalidade.toFixed(2).replace(".", ",");
}

export function PagamentoMensalistaModal({ mensalista, situacao, onClose, onToast }: PagamentoMensalistaModalProps) {
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const queryClient = useQueryClient();
  // O pagamento sempre ativa; o aviso de ativação só faz sentido para quem estava inativo.
  const ativara = !mensalista.ativo;
  const [conferencia, setConferencia] = useState<Conferencia>("nao");
  const [jaRegistrado, setJaRegistrado] = useState(false);

  const { pagar, isPending, resultado, erro, reset } = usePagamentoMensalista();
  const { reenviar, reenviandoId } = useReenviarContrato({
    onSuccess: ({ email }) =>
      onToast(`Novo link enviado para ${email}. Vale por 7 dias; o link anterior deixa de funcionar.`),
    onError: (message) => onToast(message, "error"),
  });
  const reenviando = reenviandoId === mensalista.mensalistaId;

  // Sem saber se a baixa foi gravada, um novo envio só é liberado depois de conferir a situação.
  const aguardandoConferencia = erro?.kind === "rede";

  const form = useAppForm({
    defaultValues: {
      valorPago: valorSugerido(mensalista.valorMensalidade),
      formaPagamento: String(FORMA_PAGAMENTO.Dinheiro),
    } satisfies PagamentoFormValues,
    validators: {
      onChange: ({ value }) => {
        const result = pagamentoSchema.safeParse(value);
        return result.success ? undefined : zodFieldErrors(result);
      },
    },
    onSubmit: ({ value }) => {
      setConferencia("nao");
      pagar({
        mensalistaId: mensalista.mensalistaId,
        valorPago: parseMoney(value.valorPago),
        formaPagamento: Number(value.formaPagamento),
      });
    },
  });

  const values = useStore(form.store, (state) => state.values);
  const valorDigitado = parseMoney(values.valorPago);
  const diferente = !Number.isNaN(valorDigitado) && valorDigitado !== mensalista.valorMensalidade;
  const apresentacao = apresentarSituacao(situacao);
  const comprovante = resultado !== null || jaRegistrado;

  function concluir() {
    onToast(
      jaRegistrado
        ? "Pagamento já registrado."
        : ativara
          ? "Pagamento registrado. Mensalista ativado."
          : "Pagamento registrado.",
    );
    onClose();
  }

  // Com o pagamento gravado, qualquer forma de fechar conclui; enquanto envia, o modal não fecha.
  function handleClose() {
    if (isPending) {
      return;
    }
    if (comprovante) {
      concluir();
      return;
    }
    onClose();
  }

  async function conferir() {
    setConferencia("conferindo");
    try {
      const { items } = await listMensalistas({ pagina: 1, tamanhoPagina: 20, documento: mensalista.documento });
      await queryClient.invalidateQueries({ queryKey: MENSALISTAS_QUERY_KEY });
      const atual = items.find((item) => item.mensalistaId === mensalista.mensalistaId);
      if (atual && pagamentoJaRegistrado(mensalista, atual)) {
        setJaRegistrado(true);
        return;
      }
      setConferencia("sem-mudanca");
      reset();
    } catch {
      setConferencia("falhou");
    }
  }

  async function handleSubmit() {
    await form.handleSubmit();
    formRef.current?.querySelector<HTMLInputElement>('input[aria-invalid="true"]')?.focus();
  }

  if (comprovante) {
    return (
      <Modal
        open
        title="Pagamento registrado"
        size="md"
        onClose={handleClose}
        closeOnBackdrop={false}
        footer={<Button type="button" onClick={concluir}>Concluir</Button>}
      >
        <ComprovantePagamento mensalista={mensalista} resultado={jaRegistrado ? null : resultado} ativado={ativara} />
      </Modal>
    );
  }

  return (
    <Modal
      open
      title="Registrar pagamento"
      size="md"
      onClose={handleClose}
      closeOnBackdrop={false}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} disabled={isPending || aguardandoConferencia}>
            {isPending ? "Registrando pagamento…" : rotuloConfirmar(values.valorPago, values.formaPagamento)}
          </Button>
        </>
      }
    >
      <Header>
        <Summary>
          {[mensalista.nome, mensalista.tipoMensal, formatCategoria(mensalista.categoria)].join(" · ")}
        </Summary>
        {apresentacao?.stages && (
          <StageTrack
            stages={apresentacao.stages}
            size="sm"
            tone={apresentacao.trackTone}
            label={`Situação de ${mensalista.nome}`}
          />
        )}
      </Header>

      {erro && (
        <ErrorBanner role="alert">
          <ErrorBox>
            <span>{erro.message}</span>
            {erro.kind === "contrato-nao-aceito" && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={reenviando}
                onClick={() => reenviar(mensalista.mensalistaId)}
              >
                {reenviando ? "Reenviando…" : "Reenviar contrato"}
              </Button>
            )}
            {erro.kind === "sem-cobranca" && (
              <Button type="button" variant="secondary" size="sm" onClick={onClose}>
                Fechar
              </Button>
            )}
            {erro.kind === "rede" && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={conferencia === "conferindo"}
                onClick={() => void conferir()}
              >
                {conferencia === "conferindo" ? "Conferindo…" : "Conferir situação"}
              </Button>
            )}
            {erro.kind === "rede" && conferencia === "falhou" && (
              <span role="status">Não foi possível conferir agora. Tente conferir de novo.</span>
            )}
          </ErrorBox>
        </ErrorBanner>
      )}
      {!erro && conferencia === "sem-mudanca" && (
        <StatusNote role="status">Nada foi registrado para este mensalista. Você pode tentar de novo.</StatusNote>
      )}

      <Form
        id={formId}
        ref={formRef}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void handleSubmit();
        }}
      >
        {/* Depois de uma falha de rede o erro só some ao conferir a situação (ver `conferir`). */}
        <form.AppField name="valorPago" listeners={{ onChange: () => !aguardandoConferencia && reset() }}>
          {(field) => (
            <field.TextField
              label="Valor pago (R$)"
              inputMode="decimal"
              autoComplete="off"
              autoFocus
              onFocus={(event) => event.currentTarget.select()}
              hint={`Mensalidade do tipo: ${formatBRL(mensalista.valorMensalidade)}`}
              disabled={isPending}
            />
          )}
        </form.AppField>
        {diferente && (
          <BadgeRow>
            <StatusBadge tone="warn" role="status">
              Diferente da mensalidade do tipo
            </StatusBadge>
          </BadgeRow>
        )}
        <form.AppField name="formaPagamento" listeners={{ onChange: () => !aguardandoConferencia && reset() }}>
          {(field) => <field.OptionField legend="Forma de pagamento" options={FORMAS} disabled={isPending} />}
        </form.AppField>
        <Effect>{rotuloAtivacao(ativara)}</Effect>
      </Form>
    </Modal>
  );
}
