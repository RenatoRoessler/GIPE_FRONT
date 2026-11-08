"use client";

import { useStore } from "@tanstack/react-form";
import { useId, useState } from "react";
import { formaPagamentoLabel } from "@/components/caixa/format";
import { useAppForm, zodFieldErrors } from "@/components/form";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { InfoCard } from "@/components/ui/InfoCard";
import { Modal } from "@/components/ui/Modal";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { formatBRL, maskMoney, parseMaskedMoney } from "@/lib/money";
import { formatDataInput } from "@/lib/periodo";
import { createPagarFaturaSchema } from "@/lib/schemas/fatura";
import { TECLADO_DECIMAL } from "@/lib/teclado/tipos";
import { FORMA_PAGAMENTO_OPTIONS } from "@/types/caixa";
import type { Fatura, PagarFaturaValues } from "@/types/fatura";
import { Form, Resumo, ResumoRotulo, ResumoValor } from "../Faturas.styles";
import { BotaoTexto, LinhaData } from "../FaturasMobile.styles";
import { numeroFatura } from "../format";
import { useFaturaMutations } from "../useFaturaMutations";
import { useRolarAteAviso } from "../useRolarAteAviso";

export interface PagarFaturaModalProps {
  fatura: Fatura;
  onClose: () => void;
  onPaga: () => void;
}

const INICIAL: PagarFaturaValues = { formaPagamento: "", valorPago: "", dataPagamento: "" };

// Valor digitado, válido e diferente do total da fatura (em centavos, para não tropeçar em ponto flutuante).
function diferenteDoTotal(valorPago: string, total: number): boolean {
  if (!valorPago.trim()) {
    return false;
  }
  const valor = parseMaskedMoney(valorPago);
  return !Number.isNaN(valor) && valor > 0 && Math.round(valor * 100) !== Math.round(total * 100);
}

export function PagarFaturaModal({ fatura, onClose, onPaga }: PagarFaturaModalProps) {
  const formId = useId();
  const [hoje] = useState(() => formatDataInput(new Date()));
  const { pagar } = useFaturaMutations();
  const celular = useIsMobile();
  // No celular a data fica recolhida ("agora") até o usuário pedir para alterá-la.
  const [alterandoData, setAlterandoData] = useState(false);
  // O erro fica no topo do corpo rolável do modal: ao aparecer, vem para a vista.
  const erroRef = useRolarAteAviso(pagar.isError);
  const schema = createPagarFaturaSchema({ hoje });

  const form = useAppForm({
    defaultValues: INICIAL,
    validators: {
      onChange: ({ value }) => {
        const result = schema.safeParse(value);
        return result.success ? undefined : zodFieldErrors(result);
      },
    },
    onSubmit: ({ value }) => {
      pagar.mutate({ id: fatura.convenioFaturaId, values: value, hoje }, { onSuccess: () => onPaga() });
    },
  });

  const values = useStore(form.store, (state) => state.values);
  const isSending = pagar.isPending;

  // O aviso decide se o usuário confirma: no celular sobe para logo abaixo do resumo, onde não fica abaixo da dobra.
  const avisoCaixa = <InfoCard title="Este pagamento não entra no caixa">Registre aqui só o recebimento da fatura.</InfoCard>;

  return (
    <Modal
      open
      size="sm"
      title={`Registrar pagamento · Fatura ${numeroFatura(fatura)}`}
      onClose={isSending ? () => undefined : onClose}
      closeOnBackdrop={false}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSending}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} disabled={isSending}>
            {isSending ? "Registrando…" : "Registrar pagamento"}
          </Button>
        </>
      }
    >
      {pagar.isError && (
        <div ref={erroRef}>
          <ErrorBanner role="alert">{pagar.error.message}</ErrorBanner>
        </div>
      )}
      <Resumo>
        <ResumoRotulo>Valor da fatura</ResumoRotulo>
        <ResumoValor>{formatBRL(fatura.valorTotal)}</ResumoValor>
      </Resumo>
      {celular && avisoCaixa}
      <Form
        id={formId}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
      >
        <form.AppField name="formaPagamento" listeners={{ onChange: () => pagar.reset() }}>
          {(field) =>
            celular ? (
              // Um toque em vez de dois: as formas aparecem como opções, em duas colunas.
              <field.OptionField
                legend="Forma de pagamento"
                columns={2}
                disabled={isSending}
                options={FORMA_PAGAMENTO_OPTIONS.map((opcao) => ({ value: String(opcao.value), label: formaPagamentoLabel(opcao.value) }))}
              />
            ) : (
              <field.SelectField label="Forma de pagamento" disabled={isSending}>
                <option value="">Selecione</option>
                {FORMA_PAGAMENTO_OPTIONS.map((opcao) => (
                  <option key={opcao.value} value={opcao.value}>
                    {formaPagamentoLabel(opcao.value)}
                  </option>
                ))}
              </field.SelectField>
            )
          }
        </form.AppField>
        <form.AppField name="valorPago" listeners={{ onChange: () => pagar.reset() }}>
          {(field) => (
            <field.TextField
              label="Valor pago (R$)"
              hint="Em branco: o valor total da fatura."
              inputMode="decimal"
              teclado={TECLADO_DECIMAL}
              autoComplete="off"
              placeholder={formatBRL(fatura.valorTotal)}
              format={maskMoney}
              disabled={isSending}
            />
          )}
        </form.AppField>
        {diferenteDoTotal(values.valorPago, fatura.valorTotal) && (
          <InfoCard title="Diferente do valor da fatura">O valor da fatura é {formatBRL(fatura.valorTotal)}.</InfoCard>
        )}
        {celular && !alterandoData ? (
          <LinhaData>
            <span>Data: agora</span>
            <BotaoTexto type="button" onClick={() => setAlterandoData(true)} disabled={isSending}>
              Alterar
            </BotaoTexto>
          </LinhaData>
        ) : (
          <form.AppField name="dataPagamento" listeners={{ onChange: () => pagar.reset() }}>
            {(field) => <field.TextField label="Data do pagamento" hint="Em branco: agora." type="date" max={hoje} disabled={isSending} />}
          </form.AppField>
        )}
        {!celular && avisoCaixa}
      </Form>
    </Modal>
  );
}
