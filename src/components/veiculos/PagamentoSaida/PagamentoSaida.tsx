"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Input } from "@/components/ui/Input";
import { OptionGroup } from "@/components/ui/OptionGroup";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatBRL, parseMoney } from "@/lib/money";
import { FORMA_PAGAMENTO } from "@/types/caixa";
import type { SaidaConsulta } from "@/types/saida";
import { Hint, TrocoLine, VisuallyHidden } from "../Saida.styles";
import { calcularTroco, FORMA_DINHEIRO, FORMAS_SAIDA, getPagamentoStatus } from "../saida";
import type { MeiosPagamento } from "../useMeiosPagamento";
import { CreditoIcon, DebitoIcon, DinheiroIcon, PixIcon } from "../saidaIcons";
import { Wrapper } from "./PagamentoSaida.styles";

const ICONES: Record<string, ReactNode> = {
  [String(FORMA_PAGAMENTO.Dinheiro)]: DinheiroIcon,
  [String(FORMA_PAGAMENTO.CartaoCredito)]: CreditoIcon,
  [String(FORMA_PAGAMENTO.CartaoDebito)]: DebitoIcon,
  [String(FORMA_PAGAMENTO.Pix)]: PixIcon,
};

// Sem a configuração da empresa, a saída oferece as quatro formas.
const TODOS_OS_MEIOS: MeiosPagamento = { status: "pronto", opcoes: [...FORMAS_SAIDA] };

export const MEIO_UNICO_HINT = "Único meio de pagamento aceito pela empresa.";
export const SEM_MEIOS_MESSAGE =
  "Nenhum meio de pagamento configurado. Peça ao administrador para revisar em Minha Empresa.";

export interface PagamentoSaidaProps {
  // Nulo enquanto nenhum veículo foi identificado: o pagamento fica visível, porém inativo.
  consulta: SaidaConsulta | null;
  // Meios aceitos pela empresa; sem a prop, oferece as quatro formas.
  meios?: MeiosPagamento;
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
  meios = TODOS_OS_MEIOS,
  forma,
  recebido,
  onFormaChange,
  onRecebidoChange,
  onEnter,
  disabled = false,
}: PagamentoSaidaProps) {
  const pronto = meios.status === "pronto";
  const opcoes = meios.status === "pronto" ? meios.opcoes.map((opcao) => ({ ...opcao, icon: ICONES[opcao.value] })) : [];
  const inativo = disabled || consulta === null || !pronto;
  const isDinheiro = pronto && forma === FORMA_DINHEIRO && opcoes.some((opcao) => opcao.value === FORMA_DINHEIRO);
  const valor = consulta?.valor ?? 0;
  const { canConfirm, motivo } = getPagamentoStatus(forma, recebido, valor);
  const valorRecebido = parseMoney(recebido);
  const trocoOk = isDinheiro && canConfirm;

  if (meios.status === "carregando") {
    return (
      <Wrapper role="status" aria-busy="true" aria-label="Carregando meios de pagamento">
        <Skeleton height="92px" />
        <VisuallyHidden>Carregando meios de pagamento…</VisuallyHidden>
      </Wrapper>
    );
  }

  if (meios.status === "erro") {
    return (
      <Wrapper>
        <ErrorBanner role="alert">{meios.mensagem}</ErrorBanner>
        <Button type="button" variant="secondary" onClick={meios.refetch}>
          Tentar novamente
        </Button>
      </Wrapper>
    );
  }

  if (meios.status === "vazio") {
    return (
      <Wrapper>
        <ErrorBanner role="alert">{SEM_MEIOS_MESSAGE}</ErrorBanner>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <OptionGroup
        legend="Forma de pagamento"
        options={opcoes}
        value={forma}
        onChange={onFormaChange}
        disabled={inativo}
        columns={4}
      />
      {opcoes.length === 1 && <Hint>{MEIO_UNICO_HINT}</Hint>}
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
