"use client";

import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Input } from "@/components/ui/Input";
import { OptionGroup } from "@/components/ui/OptionGroup";
import { formatBRL, parseMoney } from "@/lib/money";
import { FORMA_PAGAMENTO, FORMA_PAGAMENTO_OPTIONS } from "@/types/caixa";
import type { SaidaConsulta } from "@/types/saida";
import { formatMinutos } from "@/components/precos/format";
import {
  Hint,
  Notice,
  OldValue,
  StepForm,
  TrocoLine,
  ValueAmount,
  ValueLabel,
  ValuePanel,
  VisuallyHidden,
} from "../Saida.styles";
import { calcularTroco } from "../saida";

export const FORMA_DINHEIRO = String(FORMA_PAGAMENTO.Dinheiro);

const OPTIONS = FORMA_PAGAMENTO_OPTIONS.map((option) => ({ value: String(option.value), label: option.label }));

export interface PagamentoSaidaStepProps {
  formId: string;
  consulta: SaidaConsulta;
  // Valor da consulta anterior, quando a reconsulta mostrou outro valor.
  valorAnterior: number | null;
  forma: string;
  recebido: string;
  onFormaChange: (value: string) => void;
  onRecebidoChange: (value: string) => void;
  onSubmit: () => void;
  isPending: boolean;
  error?: string;
}

// Situação do pagamento em dinheiro; também decide se o botão de confirmar pode ser usado.
export function getPagamentoStatus(forma: string, recebido: string, valor: number) {
  if (forma === "") {
    return { canConfirm: false, motivo: "Selecione a forma de pagamento para continuar." };
  }
  if (forma !== FORMA_DINHEIRO) {
    return { canConfirm: true, motivo: undefined };
  }
  const valorRecebido = parseMoney(recebido);
  if (Number.isNaN(valorRecebido)) {
    return { canConfirm: false, motivo: "Informe o valor recebido." };
  }
  if (Math.round(valorRecebido * 100) < Math.round(valor * 100)) {
    return { canConfirm: false, motivo: `Faltam ${formatBRL(valor - valorRecebido)}.` };
  }
  return { canConfirm: true, motivo: undefined };
}

export function PagamentoSaidaStep({
  formId,
  consulta,
  valorAnterior,
  forma,
  recebido,
  onFormaChange,
  onRecebidoChange,
  onSubmit,
  isPending,
  error,
}: PagamentoSaidaStepProps) {
  const isDinheiro = forma === FORMA_DINHEIRO;
  const { canConfirm, motivo } = getPagamentoStatus(forma, recebido, consulta.valor);
  const valorRecebido = parseMoney(recebido);
  const trocoOk = isDinheiro && canConfirm;

  return (
    <StepForm
      id={formId}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (canConfirm) {
          onSubmit();
        }
      }}
    >
      {error && <ErrorBanner role="alert">{error}</ErrorBanner>}
      {valorAnterior !== null && (
        <Notice role="alert">
          O valor mudou de {formatBRL(valorAnterior)} para {formatBRL(consulta.valor)} (permanência de{" "}
          {formatMinutos(consulta.minutosPermanencia)}). Confira e confirme novamente.
        </Notice>
      )}
      <ValuePanel>
        <ValueLabel>
          {consulta.placa} · Valor a cobrar
        </ValueLabel>
        <ValueAmount>
          {valorAnterior !== null && (
            <>
              <OldValue aria-hidden="true">{formatBRL(valorAnterior)}</OldValue>
              <VisuallyHidden>era {formatBRL(valorAnterior)}, agora </VisuallyHidden>
            </>
          )}
          {consulta.valor === 0 ? "Nada a cobrar" : formatBRL(consulta.valor)}
        </ValueAmount>
      </ValuePanel>
      <OptionGroup
        legend="Forma de pagamento"
        options={OPTIONS}
        value={forma}
        onChange={onFormaChange}
        disabled={isPending}
      />
      {isDinheiro && (
        <Input
          label="Valor recebido"
          inputMode="decimal"
          placeholder="0,00"
          value={recebido}
          onChange={(event) => onRecebidoChange(event.target.value)}
          autoFocus
          autoComplete="off"
          disabled={isPending}
        />
      )}
      <div aria-live="polite">
        {isDinheiro && (
          <TrocoLine $tone={trocoOk ? "success" : recebido.trim() === "" ? "muted" : "danger"}>
            {trocoOk ? `Troco: ${formatBRL(calcularTroco(valorRecebido, consulta.valor))}` : motivo}
          </TrocoLine>
        )}
        {!canConfirm && !isDinheiro && <Hint>{motivo}</Hint>}
      </div>
    </StepForm>
  );
}
