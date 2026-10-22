"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { validarPeriodo } from "@/lib/periodoNotas";
import type { PeriodoNotas } from "@/types/notaFiscal";
import { FiltroForm } from "../Notas.styles";

export interface FiltroPeriodoProps {
  // Período aplicado agora (o que a lista mostra).
  periodo: PeriodoNotas;
  // Chamado só com um período válido.
  onAplicar: (periodo: PeriodoNotas) => void;
  disabled?: boolean;
}

export function FiltroPeriodo({ periodo, onAplicar, disabled = false }: FiltroPeriodoProps) {
  const [rascunho, setRascunho] = useState<PeriodoNotas>(periodo);
  const [erros, setErros] = useState<{ de?: string; ate?: string }>({});

  function alterar(campo: keyof PeriodoNotas, valor: string) {
    setRascunho((atual) => ({ ...atual, [campo]: valor }));
    setErros((atual) => ({ ...atual, [campo]: undefined }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const encontrados = validarPeriodo(rascunho);
    setErros(encontrados);
    if (encontrados.de || encontrados.ate) {
      return;
    }
    onAplicar(rascunho);
  }

  return (
    <FiltroForm noValidate onSubmit={handleSubmit} aria-label="Filtrar por período">
      <Input label="De" type="date" value={rascunho.de} onChange={(event) => alterar("de", event.target.value)} error={erros.de} disabled={disabled} />
      <Input label="Até" type="date" value={rascunho.ate} onChange={(event) => alterar("ate", event.target.value)} error={erros.ate} disabled={disabled} />
      <Button type="submit" disabled={disabled}>
        Filtrar
      </Button>
    </FiltroForm>
  );
}
