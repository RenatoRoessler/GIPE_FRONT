"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TECLADO_INTEIRO } from "@/lib/teclado/tipos";
import { DIAS_SEMANA_PRECO } from "@/types/preco";
import { CamposHora, ChipDia, ChipsDias, FaixaBox, FaixaTitulo } from "./GradeHorarios.styles";

// Segunda a domingo, como o gestor pensa a semana (códigos de DIAS_SEMANA_PRECO).
const DIAS_NA_ORDEM = [2, 3, 4, 5, 6, 7, 1].map((codigo) => DIAS_SEMANA_PRECO.find((dia) => dia.codigo === codigo)!);

function hora(texto: string): number | null {
  return /^\d{1,2}$/.test(texto.trim()) ? Number(texto) : null;
}

export interface FaixaRapidaProps {
  // Liga as horas de `de` até `ate` (exclusivo; se `ate` não passa de `de`, cruza a meia-noite) nos dias escolhidos.
  onAplicar: (dias: number[], de: number, ate: number) => void;
  disabled?: boolean;
}

export function FaixaRapida({ onAplicar, disabled = false }: FaixaRapidaProps) {
  const [dias, setDias] = useState<ReadonlySet<number>>(new Set());
  const [de, setDe] = useState("8");
  const [ate, setAte] = useState("18");

  const deNumero = hora(de);
  const ateNumero = hora(ate);
  const deErro = deNumero === null || deNumero > 23 ? "Use de 0 a 23" : undefined;
  const ateErro = ateNumero === null || ateNumero > 24 ? "Use de 0 a 24" : undefined;
  const podeAplicar = !disabled && dias.size > 0 && !deErro && !ateErro && deNumero !== ateNumero;

  function alternarDia(codigo: number) {
    setDias((atual) => {
      const novo = new Set(atual);
      if (!novo.delete(codigo)) {
        novo.add(codigo);
      }
      return novo;
    });
  }

  return (
    <FaixaBox role="group" aria-labelledby="faixa-rapida-titulo">
      <FaixaTitulo id="faixa-rapida-titulo">Ou monte uma faixa: escolha os dias e o horário</FaixaTitulo>
      <ChipsDias>
        {DIAS_NA_ORDEM.map((dia) => (
          <ChipDia
            key={dia.codigo}
            type="button"
            disabled={disabled}
            aria-pressed={dias.has(dia.codigo)}
            aria-label={dia.label}
            onClick={() => alternarDia(dia.codigo)}
          >
            {dia.label.slice(0, 3)}
          </ChipDia>
        ))}
      </ChipsDias>
      <CamposHora>
        <Input
          label="De (hora)"
          value={de}
          inputMode="numeric"
          teclado={TECLADO_INTEIRO}
          maxLength={2}
          disabled={disabled}
          error={deErro}
          onChange={(evento) => setDe(evento.target.value.replace(/\D/g, ""))}
        />
        <Input
          label="Até (hora)"
          value={ate}
          inputMode="numeric"
          teclado={TECLADO_INTEIRO}
          maxLength={2}
          disabled={disabled}
          error={ateErro}
          onChange={(evento) => setAte(evento.target.value.replace(/\D/g, ""))}
        />
        <Button
          type="button"
          variant="secondary"
          disabled={!podeAplicar}
          onClick={() => onAplicar([...dias], deNumero!, ateNumero!)}
        >
          Aplicar
        </Button>
      </CamposHora>
    </FaixaBox>
  );
}
