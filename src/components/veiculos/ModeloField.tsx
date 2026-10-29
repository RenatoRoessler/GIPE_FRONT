"use client";

import { ComboboxField, type ComboboxFieldProps } from "@/components/form/ComboboxField";
import { useFieldContext } from "@/components/form/context";
import { useSugestoesModelo } from "./useSugestoesModelo";

export type ModeloFieldProps = Omit<ComboboxFieldProps, "options" | "loading" | "label">;

// Campo "Modelo" com as sugestões da lista carregada ao abrir o sistema; o texto livre continua valendo.
export function ModeloField(props: ModeloFieldProps) {
  const field = useFieldContext<string>();
  const { opcoes, carregando } = useSugestoesModelo(field.state.value);

  return (
    <ComboboxField
      label="Modelo"
      options={opcoes}
      loading={carregando}
      emptyText="Nenhum modelo na lista — vamos usar o que você digitou."
      {...props}
    />
  );
}
