"use client";

import { useStore } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useId, useRef, useState } from "react";
import { formatDateTime } from "@/components/caixa/format";
import { useAppForm, zodFieldErrors } from "@/components/form";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Modal } from "@/components/ui/Modal";
import { ApiError } from "@/lib/api/errors";
import { solicitarNotaFiscal } from "@/lib/api/services/notaFiscal";
import { formatCPF } from "@/lib/cpf";
import { formatCnpjAlfanumerico } from "@/lib/documento";
import { formatBRL } from "@/lib/money";
import { formatPlacaExibicao } from "@/lib/placa";
import { NOTA_EMAIL_MAX, solicitarNotaSchema, type SolicitarNotaValues } from "@/lib/schemas/notaFiscal";
import type { NotaSolicitada } from "@/types/notaFiscal";
import { Confirmacao, Form, ValorNota } from "./NotaFiscalModal.styles";

export interface NotaFiscalModalProps {
  // Código do recibo da saída paga: a empresa da nota vem dele.
  token: string;
  // Valor do recibo, em reais: o back exige que a nota seja igual a ele.
  valor: number;
  placa?: string | null;
  onClose: () => void;
  // Chamado só quando a solicitação foi aceita agora (não quando já existia).
  onSolicitada: (nota: NotaSolicitada) => void;
}

const EMPTY_VALUES: SolicitarNotaValues = { email: "", pessoaJuridica: false, documento: "" };
const CONTADOR_A_PARTIR_DE = 120;

// [A CONFIRMAR] O back responde 400 para "já existe nota deste recibo"; sem código estruturado, a detecção é pela
// mensagem. Trocar por checagem de código quando existir.
function isJaSolicitada(error: unknown): boolean {
  return error instanceof ApiError && error.kind === "validation" && /j[aá] (foi )?solicitad|j[aá] existe|uma nota por recibo|j[aá] possui/i.test(error.message);
}

function mensagemDeErro(error: Error): string {
  if (isJaSolicitada(error)) {
    return "A nota fiscal deste recibo já foi solicitada.";
  }
  if (error instanceof ApiError && error.kind === "rate_limited") {
    return "Muitas tentativas. Aguarde um minuto e tente de novo.";
  }
  return error.message;
}

export function NotaFiscalModal({ token, valor, placa, onClose, onSolicitada }: NotaFiscalModalProps) {
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const tituloRef = useRef<HTMLHeadingElement>(null);
  const [solicitada, setSolicitada] = useState<NotaSolicitada | null>(null);
  const [confirmingClose, setConfirmingClose] = useState(false);

  const mutation = useMutation({
    mutationFn: (values: SolicitarNotaValues) => solicitarNotaFiscal({ token, valor, email: values.email, documento: values.documento }),
    onSuccess: (nota) => {
      setSolicitada(nota);
      onSolicitada(nota);
    },
  });

  const form = useAppForm({
    defaultValues: EMPTY_VALUES,
    validators: {
      onChange: ({ value }) => {
        const result = solicitarNotaSchema.safeParse(value);
        return result.success ? undefined : zodFieldErrors(result);
      },
    },
    onSubmit: ({ value }) => mutation.mutate(value),
  });

  const emailLength = useStore(form.store, (state) => state.values.email.length);
  const emailPreenchido = useStore(form.store, (state) => state.values.email.trim() !== "");
  const pessoaJuridica = useStore(form.store, (state) => state.values.pessoaJuridica);
  const hasChanges = useStore(form.store, ({ values }) => values.email !== "" || values.documento !== "" || values.pessoaJuridica);

  const isSending = mutation.isPending;
  const jaSolicitada = mutation.isError && isJaSolicitada(mutation.error);

  // Na confirmação, o foco vai ao título para o leitor de tela anunciar o resultado.
  useEffect(() => {
    if (solicitada) {
      tituloRef.current?.focus();
    }
  }, [solicitada]);

  function handleClose() {
    if (isSending) {
      return;
    }
    // Com dados em andamento (e nada enviado), pede confirmação antes de descartar.
    if (hasChanges && !solicitada && !jaSolicitada) {
      setConfirmingClose(true);
      return;
    }
    onClose();
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    void form.handleSubmit().then(() => {
      // Leva o foco ao primeiro campo com erro, para quem usa teclado ou leitor de tela.
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
    });
  }

  const referencia = placa ? `Saída de ${formatPlacaExibicao(placa)}` : "Valor do recibo";

  return (
    <Modal
      open
      title="Gerar nota fiscal"
      onClose={handleClose}
      closeOnBackdrop={false}
      footer={
        solicitada ? (
          <Button type="button" onClick={onClose}>
            Concluir
          </Button>
        ) : jaSolicitada ? (
          <Button type="button" onClick={onClose}>
            Fechar
          </Button>
        ) : (
          <>
            <Button type="button" variant="secondary" onClick={handleClose} disabled={isSending}>
              Cancelar
            </Button>
            <Button type="submit" form={formId} disabled={isSending || !emailPreenchido}>
              {isSending ? "Enviando…" : "Solicitar nota"}
            </Button>
          </>
        )
      }
    >
      {solicitada ? (
        <Confirmacao role="status">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M8 12.5l3 3 5-6" />
          </svg>
          <h3 ref={tituloRef} tabIndex={-1}>
            Nota fiscal solicitada
          </h3>
          <dl>
            <dt>Solicitada em</dt>
            <dd>{formatDateTime(solicitada.dataSolicitacao)}</dd>
            <dt>Valor</dt>
            <dd>{formatBRL(solicitada.valor ?? valor)}</dd>
          </dl>
          <p>A empresa vai lançar a nota com os dados informados.</p>
        </Confirmacao>
      ) : (
        <>
          {mutation.isError && <ErrorBanner role="alert">{mensagemDeErro(mutation.error)}</ErrorBanner>}
          <Form ref={formRef} id={formId} noValidate onSubmit={handleSubmit}>
            <ValorNota>
              <span className="label">Valor da nota</span>
              <span className="amount">{formatBRL(valor)}</span>
              <span className="ref">{referencia}</span>
            </ValorNota>
            <form.AppField name="email" listeners={{ onChange: () => mutation.reset() }}>
              {(field) => (
                <field.TextField
                  label="E-mail"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  maxLength={NOTA_EMAIL_MAX}
                  hint={emailLength >= CONTADOR_A_PARTIR_DE ? `${emailLength}/${NOTA_EMAIL_MAX} caracteres` : undefined}
                  disabled={isSending || jaSolicitada}
                />
              )}
            </form.AppField>
            <form.AppField name="pessoaJuridica">
              {(field) => (
                <Checkbox
                  label="Pessoa jurídica"
                  hint="Marque se a nota for para uma empresa: o CNPJ passa a ser obrigatório."
                  name={field.name}
                  checked={field.state.value}
                  disabled={isSending || jaSolicitada}
                  onCheckedChange={(checked) => {
                    field.handleChange(checked);
                    // O documento digitado era do outro tipo de pessoa: recomeça vazio, sem erro antigo.
                    form.resetField("documento");
                  }}
                />
              )}
            </form.AppField>
            <form.AppField name="documento">
              {(field) => (
                <field.TextField
                  label={pessoaJuridica ? "CNPJ" : "CPF"}
                  autoComplete="off"
                  inputMode={pessoaJuridica ? "text" : "numeric"}
                  format={pessoaJuridica ? formatCnpjAlfanumerico : formatCPF}
                  hint={pessoaJuridica ? "Obrigatório para pessoa jurídica." : "Opcional. Informe para constar na nota."}
                  disabled={isSending || jaSolicitada}
                />
              )}
            </form.AppField>
            {/* Botão padrão do formulário: faz o Enter enviar mesmo com o botão visível no rodapé do modal. */}
            <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
          </Form>
        </>
      )}
      {confirmingClose && (
        <ConfirmDialog
          title="Descartar a solicitação?"
          message="Os dados preenchidos serão perdidos e nenhuma nota será solicitada."
          confirmLabel="Descartar"
          cancelLabel="Continuar editando"
          onConfirm={onClose}
          onCancel={() => setConfirmingClose(false)}
        />
      )}
    </Modal>
  );
}
