"use client";

import { ComboboxField, type ComboboxFieldProps } from "@/components/form/ComboboxField";
import { useFieldContext } from "@/components/form/context";
import { useSugestoesModelo } from "./useSugestoesModelo";
import { TECLADO_ALFA } from "@/lib/teclado/tipos";

// `label` só muda quando o campo não é obrigatório ("Modelo (opcional)").
export type ModeloFieldProps = Omit<ComboboxFieldProps, "options" | "loading" | "label"> & { label?: string };

// Campo "Modelo" com as sugestões da lista carregada ao abrir o sistema; o texto livre continua valendo.
export function ModeloField({ label = "Modelo", ...props }: ModeloFieldProps) {
  const field = useFieldContext<string>();
  const { opcoes, carregando } = useSugestoesModelo(field.state.value);

  return (
    <ComboboxField
      label={label}
      options={opcoes}
      loading={carregando}
      emptyText="Nenhum modelo na lista — vamos usar o que você digitou."
      teclado={TECLADO_ALFA}
      {...props}
    />
  );
}
