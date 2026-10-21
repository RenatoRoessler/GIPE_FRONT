"use client";

import { useStore } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useAppForm, zodFieldErrors } from "@/components/form";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { aceitarContrato, ContratoError } from "@/lib/api/services/contrato";
import { formatDocumentoAuto } from "@/lib/documento";
import { aceiteSchema } from "@/lib/schemas/contrato";
import type { AceiteContrato } from "@/types/contrato";
import { FechoTitle, Form, HashLine, LinkButton, Small } from "./Contrato.styles";
import { formatHash } from "./format";
import { formatCountdown, useCountdown } from "./useCountdown";

// Esperar o limite de tentativas (10 por minuto por IP) liberar.
const ESPERA_LIMITE_SEGUNDOS = 60;
const MSG_DOCUMENTO = "O documento não confere com o do cadastro. Confira e tente de novo.";

export type EstadoContrato = "vencido" | "invalido" | "ja-aceito";

export interface ConfirmacaoAceiteProps {
  token: string;
  hash: string;
  onAceito: (resultado: AceiteContrato) => void;
  // O contrato mudou por baixo (venceu, foi aceito em outro lugar, deixou de existir): a página troca de tela.
  onEstado: (estado: EstadoContrato) => void;
}

export function ConfirmacaoAceite({ token, hash, onAceito, onEstado }: ConfirmacaoAceiteProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [hashCompleto, setHashCompleto] = useState(false);
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const { restante, iniciar } = useCountdown();

  const mutation = useMutation({
    mutationFn: (documento: string) => aceitarContrato(token, documento),
    onMutate: () => setErroGeral(null),
    onSuccess: onAceito,
    onError: (error) => {
      if (error instanceof ContratoError) {
        if (error.contratoKind === "documento") {
          form.setFieldMeta("documento", (meta) => ({
            ...meta,
            isTouched: true,
            errorMap: { ...meta.errorMap, onServer: MSG_DOCUMENTO },
          }));
          requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('input[name="documento"]')?.focus());
          return;
        }
        if (error.contratoKind === "rate-limited") {
          iniciar(ESPERA_LIMITE_SEGUNDOS);
          setErroGeral("Muitas tentativas seguidas. Aguarde 1 minuto e tente de novo.");
          return;
        }
        onEstado(error.contratoKind);
        return;
      }
      setErroGeral(error.message);
    },
  });

  const form = useAppForm({
    defaultValues: { aceito: false, documento: "" },
    validators: {
      onChange: ({ value }) => {
        const result = aceiteSchema.safeParse(value);
        return result.success ? undefined : zodFieldErrors(result);
      },
    },
    onSubmit: ({ value }) => mutation.mutate(value.documento),
  });

  const tentativas = useStore(form.store, (state) => state.submissionAttempts);
  const enviando = mutation.isPending;

  // Tentou enviar incompleto: o foco vai ao primeiro campo com problema.
  useEffect(() => {
    if (tentativas === 0) {
      return;
    }
    const frame = requestAnimationFrame(() => {
      if (!form.state.isValid) {
        formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [tentativas, form]);

  return (
    <>
      <FechoTitle>Confirmação</FechoTitle>
      {erroGeral && <ErrorBanner role="alert">{erroGeral}</ErrorBanner>}
      <Form
        ref={formRef}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
      >
        <form.AppField name="aceito">
          {(field) => {
            const erro = field.state.meta.isTouched ? field.state.meta.errors[0] : undefined;
            return (
              <Checkbox
                name="aceito"
                label="Li e concordo com os termos deste contrato."
                checked={field.state.value}
                onCheckedChange={field.handleChange}
                error={typeof erro === "string" ? erro : undefined}
                disabled={enviando}
              />
            );
          }}
        </form.AppField>
        <form.AppField
          name="documento"
          listeners={{
            // Corrigiu o documento: o erro que veio do servidor não vale mais.
            onChange: () =>
              form.setFieldMeta("documento", (meta) => ({
                ...meta,
                errorMap: { ...meta.errorMap, onServer: undefined },
              })),
          }}
        >
          {(field) => (
            <field.TextField
              label="CPF ou CNPJ"
              format={formatDocumentoAuto}
              inputMode="text"
              autoComplete="off"
              hint="O mesmo informado no cadastro."
              disabled={enviando}
            />
          )}
        </form.AppField>
        <Button type="submit" disabled={enviando || restante > 0}>
          {enviando ? "Registrando aceite…" : restante > 0 ? `Tentar em ${formatCountdown(restante)}` : "Aceitar contrato"}
        </Button>
      </Form>
      <Small>Ao aceitar, registramos data, hora, endereço IP e navegador como comprovação.</Small>
      {hash && (
        <HashLine>
          <span>Identificação do texto:</span>
          <span>{formatHash(hash, hashCompleto)}</span>
          <LinkButton type="button" aria-expanded={hashCompleto} onClick={() => setHashCompleto((atual) => !atual)}>
            {hashCompleto ? "Ver resumo" : "Ver completo"}
          </LinkButton>
        </HashLine>
      )}
    </>
  );
}
