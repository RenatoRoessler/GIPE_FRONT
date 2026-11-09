"use client";

import { useStore } from "@tanstack/react-form";
import { useAppForm, zodFieldErrors } from "@/components/form";
import {
  precoCategoriasSchema,
  precoFaixasSchema,
  precoHorariosSchema,
  precoInfoSchema,
} from "@/lib/schemas/preco";
import type { PrecoFormValues } from "@/types/preco";

// Os quatro formulários da tabela (identificação e vigência, horários, degraus e categorias) e os valores juntos.
// As seções navegam livremente: o envio é feito no fim, então os formulários não têm ação própria.
export function usePrecoForms(initial: PrecoFormValues) {
  const infoForm = useAppForm({
    defaultValues: initial.info,
    validators: {
      onChange: ({ value }) => {
        const result = precoInfoSchema.safeParse(value);
        return result.success ? undefined : zodFieldErrors(result);
      },
    },
  });

  const horariosForm = useAppForm({
    defaultValues: { horarios: initial.horarios },
    validators: {
      onChange: ({ value }) => {
        const result = precoHorariosSchema.safeParse(value);
        return result.success ? undefined : zodFieldErrors(result);
      },
    },
  });

  const faixasForm = useAppForm({
    defaultValues: { faixas: initial.faixas },
    validators: {
      onChange: ({ value }) => {
        const result = precoFaixasSchema.safeParse(value);
        return result.success ? undefined : zodFieldErrors(result);
      },
    },
  });

  const categoriasForm = useAppForm({
    defaultValues: { categorias: initial.categorias },
    validators: {
      onChange: ({ value }) => {
        const result = precoCategoriasSchema.safeParse(value);
        return result.success ? undefined : zodFieldErrors(result);
      },
    },
  });

  const info = useStore(infoForm.store, (state) => state.values);
  const horarios = useStore(horariosForm.store, (state) => state.values.horarios);
  const faixas = useStore(faixasForm.store, (state) => state.values.faixas);
  const categorias = useStore(categoriasForm.store, (state) => state.values.categorias);

  const infoDirty = useStore(infoForm.store, (state) => state.isDirty);
  const horariosDirty = useStore(horariosForm.store, (state) => state.isDirty);
  const faixasDirty = useStore(faixasForm.store, (state) => state.isDirty);
  const categoriasDirty = useStore(categoriasForm.store, (state) => state.isDirty);
  const isDirty = infoDirty || horariosDirty || faixasDirty || categoriasDirty;

  const values: PrecoFormValues = { info, horarios, faixas, categorias };

  // Marca todos os campos como tocados, para os erros aparecerem quando a seção for aberta.
  async function submitAll() {
    await Promise.all([
      infoForm.handleSubmit(),
      horariosForm.handleSubmit(),
      faixasForm.handleSubmit(),
      categoriasForm.handleSubmit(),
    ]);
  }

  return { infoForm, horariosForm, faixasForm, categoriasForm, values, isDirty, faixasDirty, submitAll };
}

export type PrecoForms = ReturnType<typeof usePrecoForms>;
