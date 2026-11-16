"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { ChangeDisplay } from "@/components/ui/ChangeDisplay";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Input } from "@/components/ui/Input";
import { OptionGroup } from "@/components/ui/OptionGroup";
import { QuickAmountChips, type QuickAmountOption } from "@/components/ui/QuickAmountChips";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatBRL, maskMoney, parseMoney } from "@/lib/money";
import { FORMA_PAGAMENTO } from "@/types/caixa";
import type { SaidaConsulta } from "@/types/saida";
import { Hint, VisuallyHidden } from "../Saida.styles";
import { FORMA_DINHEIRO, FORMAS_SAIDA, getPagamentoStatus, sugerirValoresRecebidos } from "../saida";
import type { AtalhoRecebido } from "../SaidaVeiculoModal/useSaidaFlow";
import type { MeiosPagamento } from "../useMeiosPagamento";
import { CreditoIcon, DebitoIcon, DinheiroIcon, PixIcon } from "../saidaIcons";
import { Wrapper } from "./PagamentoSaida.styles";
import { TECLADO_DECIMAL } from "@/lib/teclado/tipos";

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

export const ESCOLHA_ATALHO_MESSAGE = "Escolha quanto o cliente pagou.";
export const DIGITE_VALOR_HINT = "Digite o valor que o cliente entregou.";

// O atalho escolhido vira o valor do chip correspondente (e o inverso).
const atalhoParaChip = (atalho: AtalhoRecebido | null): string | null => (atalho === null ? null : String(atalho));
const chipParaAtalho = (chip: string): AtalhoRecebido => (chip === "exato" || chip === "outro" ? chip : Number(chip));

export interface PagamentoSaidaProps {
  // Nulo enquanto nenhum veículo foi identificado: o pagamento fica visível, porém inativo.
  consulta: SaidaConsulta | null;
  // Meios aceitos pela empresa; sem a prop, oferece as quatro formas.
  meios?: MeiosPagamento;
  forma: string;
  recebido: string;
  // Atalho de "cliente pagou com" (só em dinheiro); nulo enquanto o operador não escolheu.
  atalho: AtalhoRecebido | null;
  onAtalhoChange: (atalho: AtalhoRecebido) => void;
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
  atalho,
  onAtalhoChange,
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
  const opcoesAtalho: QuickAmountOption[] = [
    { value: "exato", label: "Exato" },
    ...sugerirValoresRecebidos(valor).map((nota) => ({ value: String(nota), label: `R$ ${nota}` })),
    { value: "outro", label: "Outro" },
  ];
  const faltaOutro = atalho === "outro" && recebido.trim() !== "" && !canConfirm;

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
        <QuickAmountChips
          legend="Cliente pagou com"
          options={opcoesAtalho}
          value={atalhoParaChip(atalho)}
          onChange={(chip) => onAtalhoChange(chipParaAtalho(chip))}
          disabled={inativo}
        />
      )}
      {isDinheiro && atalho === "outro" && (
        <Input
          label="Valor recebido"
          inputMode="decimal"
          teclado={TECLADO_DECIMAL}
          placeholder="R$ 0,00"
          value={recebido}
          onChange={(event) => onRecebidoChange(maskMoney(event.target.value))}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onEnter?.();
            }
          }}
          autoComplete="off"
          autoFocus
          error={faltaOutro ? `Faltam ${formatBRL(valor - valorRecebido)} para o valor cobrado.` : undefined}
          hint={faltaOutro ? undefined : DIGITE_VALOR_HINT}
          disabled={inativo}
        />
      )}
      {consulta && trocoOk && <ChangeDisplay recebido={valorRecebido} valor={valor} />}
      <div aria-live="polite">
        {consulta && isDinheiro && atalho === null && <Hint>{ESCOLHA_ATALHO_MESSAGE}</Hint>}
        {consulta && !canConfirm && !isDinheiro && <Hint>{motivo}</Hint>}
      </div>
    </Wrapper>
  );
}
