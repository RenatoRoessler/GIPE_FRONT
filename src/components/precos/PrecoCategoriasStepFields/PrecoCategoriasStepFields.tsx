"use client";

import type { ReactNode } from "react";
import { withForm } from "@/components/form";
import { Text } from "@/components/ui/Text";
import {
  TIPO_CATEGORIA,
  TIPO_CATEGORIA_OPTIONS,
  type PrecoCategoriasValues,
  type TipoCategoria,
} from "@/types/preco";
import { ChipInput, ChipLabel, Chips, Group, GroupLegend, SummaryArea } from "./PrecoCategoriasStepFields.styles";

const DEFAULT_VALUES: PrecoCategoriasValues = { categorias: [] };

// "Todas" é exclusiva: marcá-la limpa as demais; marcar outra categoria desmarca "Todas".
export function toggleCategoria(current: TipoCategoria[], tipo: TipoCategoria): TipoCategoria[] {
  if (current.includes(tipo)) {
    return current.filter((item) => item !== tipo);
  }
  if (tipo === TIPO_CATEGORIA.Todas) {
    return [TIPO_CATEGORIA.Todas];
  }
  return [...current.filter((item) => item !== TIPO_CATEGORIA.Todas), tipo];
}

export const PrecoCategoriasStepFields = withForm({
  defaultValues: DEFAULT_VALUES,
  props: {} as { disabled?: boolean; summary?: ReactNode },
  render: function Render({ form, disabled = false, summary }) {
    return (
      <>
        <form.Field name="categorias">
          {(field) => {
            const selected = field.state.value;
            const error = field.state.meta.isTouched ? field.state.meta.errors[0] : undefined;
            const errorMessage = typeof error === "string" ? error : undefined;
            const allSelected = selected.includes(TIPO_CATEGORIA.Todas);

            return (
              <Group aria-describedby={errorMessage ? `${field.name}-error` : undefined}>
                <GroupLegend>Selecione as categorias de veículo que esta tabela atende.</GroupLegend>
                <Chips>
                  {TIPO_CATEGORIA_OPTIONS.map((option) => {
                    const checked = selected.includes(option.value);
                    const itemDisabled = disabled || (allSelected && option.value !== TIPO_CATEGORIA.Todas);

                    return (
                      <ChipLabel key={option.value} $checked={checked} $disabled={itemDisabled}>
                        <ChipInput
                          type="checkbox"
                          name={field.name}
                          checked={checked}
                          disabled={itemDisabled}
                          onChange={() => field.handleChange(toggleCategoria(selected, option.value))}
                          onBlur={field.handleBlur}
                        />
                        {option.label}
                      </ChipLabel>
                    );
                  })}
                </Chips>
                {errorMessage && (
                  <Text variant="error" id={`${field.name}-error`} role="alert">
                    {errorMessage}
                  </Text>
                )}
              </Group>
            );
          }}
        </form.Field>
        {summary && <SummaryArea>{summary}</SummaryArea>}
      </>
    );
  },
});
