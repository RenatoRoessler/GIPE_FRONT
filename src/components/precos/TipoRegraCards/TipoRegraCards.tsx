"use client";

import { useId } from "react";
import { TIPO_REGRA, TIPO_REGRA_OPTIONS, type TipoRegra } from "@/types/preco";
import { Card, CardHint, CardTitle, Cards, ErrorText, Fieldset, Legend, RadioInput } from "./TipoRegraCards.styles";

const DESCRICOES: Record<TipoRegra, string> = {
  [TIPO_REGRA.Padrao]: "Tarifa de uso geral do dia a dia.",
  [TIPO_REGRA.Convenio]: "Com desconto para empresas conveniadas.",
  [TIPO_REGRA.Promocional]: "Para campanhas por tempo limitado.",
  [TIPO_REGRA.Evento]: "Para dias específicos, como jogos e shows.",
};

export interface TipoRegraCardsProps {
  // Valor do enum como texto (o formato do formulário).
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
}

// Escolha única do tipo de regra, com uma frase explicando cada um. Radios nativos: setas, foco e leitor de tela vêm do navegador.
export function TipoRegraCards({ value, onChange, disabled = false, error }: TipoRegraCardsProps) {
  const name = useId();

  return (
    <Fieldset disabled={disabled} aria-invalid={Boolean(error)}>
      <Legend>Tipo de regra</Legend>
      <Cards>
        {TIPO_REGRA_OPTIONS.map((option) => {
          const checked = String(option.value) === value;
          return (
            <Card key={option.value} $checked={checked} $disabled={disabled}>
              <RadioInput
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => onChange(String(option.value))}
              />
              <CardTitle>{option.label}</CardTitle>
              <CardHint>{DESCRICOES[option.value]}</CardHint>
            </Card>
          );
        })}
      </Cards>
      {error && <ErrorText role="alert">{error}</ErrorText>}
    </Fieldset>
  );
}
