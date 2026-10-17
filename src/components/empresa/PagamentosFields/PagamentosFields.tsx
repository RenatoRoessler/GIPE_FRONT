"use client";

import { useId, type ReactNode } from "react";
import { withForm } from "@/components/form";
import { Text } from "@/components/ui/Text";
import { CreditoIcon, DebitoIcon, DinheiroIcon, PixIcon } from "@/components/veiculos/saidaIcons";
import { EMPTY_PAYMENTS_DATA, MEIOS_PAGAMENTO, type PaymentsData } from "@/types/adesao";
import { ErroGrupo, Fieldset, Icone, Legend, Linha, Meios } from "./PagamentosFields.styles";

const ICONES: Record<keyof PaymentsData, ReactNode> = {
  dinheiro: DinheiroIcon,
  pix: PixIcon,
  cartaoCredito: CreditoIcon,
  cartaoDebito: DebitoIcon,
};

// O erro "pelo menos um meio" é do conjunto, mas o schema o grava no primeiro campo (`dinheiro`).
export const PagamentosFields = withForm({
  defaultValues: EMPTY_PAYMENTS_DATA,
  props: {} as { disabled?: boolean },
  render: function Render({ form, disabled }) {
    const errorId = useId();

    return (
      <form.Subscribe
        selector={(state) => ({
          values: state.values,
          mensagem: state.fieldMeta.dinheiro?.errors?.[0],
          // Só aparece depois de alguma interação ou de uma tentativa de envio.
          interagiu:
            state.submissionAttempts > 0 ||
            MEIOS_PAGAMENTO.some(({ key }) => state.fieldMeta[key]?.isDirty || state.fieldMeta[key]?.isTouched),
        })}
      >
        {({ values, mensagem, interagiu }) => {
          const erro = interagiu && mensagem ? String(mensagem) : undefined;

          return (
            <Fieldset aria-describedby={erro ? errorId : undefined}>
              <Legend>Meios de pagamento aceitos</Legend>
              <Text variant="muted">Só os meios ligados aparecem na saída de veículos.</Text>
              <Meios>
                {MEIOS_PAGAMENTO.map(({ key, label }, index) => (
                  <Linha key={key} $checked={values[key]} $hasError={Boolean(erro)}>
                    <Icone aria-hidden="true">{ICONES[key]}</Icone>
                    <form.AppField name={key}>
                      {(field) => (
                        <field.SwitchField
                          label={label}
                          disabled={disabled}
                          aria-describedby={erro ? errorId : undefined}
                          invalid={Boolean(erro) && index === 0}
                        />
                      )}
                    </form.AppField>
                  </Linha>
                ))}
              </Meios>
              {erro && (
                <ErroGrupo id={errorId} role="alert">
                  {erro}
                </ErroGrupo>
              )}
            </Fieldset>
          );
        }}
      </form.Subscribe>
    );
  },
});
