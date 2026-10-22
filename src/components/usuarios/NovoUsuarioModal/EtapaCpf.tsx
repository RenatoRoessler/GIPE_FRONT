"use client";

import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Input } from "@/components/ui/Input";
import { formatCPF, isValidCPF } from "@/lib/cpf";
import { Form, InfoBanner } from "../Usuarios.styles";

export interface EtapaCpfProps {
  formId: string;
  cpf: string;
  onCpfChange: (cpf: string) => void;
  touched: boolean;
  onBlur: () => void;
  onSubmit: () => void;
  disabled: boolean;
  // Mensagem de erro da consulta (rede, API).
  erro?: string;
  // CPF já vinculado à empresa: o cadastro não segue.
  bloqueado: boolean;
  onEditarExistente?: () => void;
}

export function EtapaCpf({
  formId,
  cpf,
  onCpfChange,
  touched,
  onBlur,
  onSubmit,
  disabled,
  erro,
  bloqueado,
  onEditarExistente,
}: EtapaCpfProps) {
  const invalido = touched && cpf !== "" && !isValidCPF(cpf);

  return (
    <Form
      id={formId}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      {erro && <ErrorBanner role="alert">{erro}</ErrorBanner>}
      {bloqueado && (
        <InfoBanner role="status">
          <span>Esta pessoa já tem acesso a esta empresa.</span>
          {onEditarExistente && (
            <Button type="button" variant="secondary" size="sm" onClick={onEditarExistente}>
              Editar usuário
            </Button>
          )}
        </InfoBanner>
      )}
      <Input
        label="CPF"
        value={cpf}
        onChange={(event) => onCpfChange(formatCPF(event.target.value))}
        onBlur={onBlur}
        error={invalido ? "CPF inválido" : undefined}
        inputMode="numeric"
        autoComplete="off"
        autoFocus
        disabled={disabled}
      />
    </Form>
  );
}
