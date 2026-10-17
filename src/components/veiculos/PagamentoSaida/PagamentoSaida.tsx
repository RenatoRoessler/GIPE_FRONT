"use client";

import type { ReactNode } from "react";
import { Input } from "@/components/ui/Input";
import { OptionGroup } from "@/components/ui/OptionGroup";
import { formatBRL, parseMoney } from "@/lib/money";
import { FORMA_PAGAMENTO } from "@/types/caixa";
import type { SaidaConsulta } from "@/types/saida";
import { Hint, TrocoLine } from "../Saida.styles";
import { calcularTroco, FORMA_DINHEIRO, FORMAS_SAIDA, getPagamentoStatus } from "../saida";
import { CreditoIcon, DebitoIcon, DinheiroIcon, PixIcon } from "../saidaIcons";
import { Wrapper } from "./PagamentoSaida.styles";

const ICONES: Record<string, ReactNode> = {
  [String(FORMA_PAGAMENTO.Dinheiro)]: DinheiroIcon,
  [String(FORMA_PAGAMENTO.CartaoCredito)]: CreditoIcon,
  [String(FORMA_PAGAMENTO.CartaoDebito)]: DebitoIcon,
  [String(FORMA_PAGAMENTO.Pix)]: PixIcon,
};

const OPTIONS = FORMAS_SAIDA.map((forma) => ({ ...forma, icon: ICONES[forma.value] }));

export interface PagamentoSaidaProps {
  // Nulo enquanto nenhum veículo foi identificado: o pagamento fica visível, porém inativo.
  consulta: SaidaConsulta | null;
  forma: string;
  recebido: string;
  onFormaChange: (value: string) => void;
  onRecebidoChange: (value: string) => void;
  // Enter no valor recebido pede a confirmação.
  onEnter?: () => void;
  disabled?: boolean;
}

export function PagamentoSaida({
  consulta,
  forma,
  recebido,
  onFormaChange,
  onRecebidoChange,
  onEnter,
  disabled = false,
}: PagamentoSaidaProps) {
  const inativo = disabled || consulta === null;
  const isDinheiro = forma === FORMA_DINHEIRO;
  const valor = consulta?.valor ?? 0;
  const { canConfirm, motivo } = getPagamentoStatus(forma, recebido, valor);
  const valorRecebido = parseMoney(recebido);
  const trocoOk = isDinheiro && canConfirm;

  return (
    <Wrapper>
      <OptionGroup
        legend="Forma de pagamento"
        options={OPTIONS}
        value={forma}
        onChange={onFormaChange}
        disabled={inativo}
        columns={4}
      />
      {isDinheiro && (
        <Input
          label="Valor recebido"
          inputMode="decimal"
          placeholder="0,00"
          value={recebido}
          onChange={(event) => onRecebidoChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onEnter?.();
            }
          }}
          autoComplete="off"
          disabled={inativo}
        />
      )}
      <div aria-live="polite">
        {consulta && isDinheiro && (
          <TrocoLine $tone={trocoOk ? "success" : recebido.trim() === "" ? "muted" : "danger"}>
            {trocoOk ? `Troco: ${formatBRL(calcularTroco(valorRecebido, valor))}` : motivo}
          </TrocoLine>
        )}
        {consulta && !canConfirm && !isDinheiro && <Hint>{motivo}</Hint>}
      </div>
    </Wrapper>
  );
}
