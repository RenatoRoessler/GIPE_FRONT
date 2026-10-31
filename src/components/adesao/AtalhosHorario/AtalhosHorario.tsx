"use client";

import { BusinessHoursData } from "@/types/adesao";
import { aplicar24Horas, aplicarSegSex, aplicarTodosOsDias, copiarSegunda } from "../horarios";
import { Atalhos, Chip } from "./AtalhosHorario.styles";

export interface AtalhosHorarioProps {
  hours: BusinessHoursData;
  onAplicar: (hours: BusinessHoursData) => void;
  disabled?: boolean;
}

const PRESETS = [
  { label: "Seg–Sex 08–18", gerar: aplicarSegSex },
  { label: "Todos os dias", gerar: aplicarTodosOsDias },
  { label: "24 horas", gerar: aplicar24Horas },
] as const;

function iguais(a: BusinessHoursData, b: BusinessHoursData) {
  return JSON.stringify(a.horarios) === JSON.stringify(b.horarios);
}

// Chips que preenchem os 7 dias de uma vez; o ajuste dia a dia continua disponível abaixo.
export function AtalhosHorario({ hours, onAplicar, disabled }: AtalhosHorarioProps) {
  return (
    <Atalhos role="group" aria-label="Atalhos de horário">
      {PRESETS.map(({ label, gerar }) => {
        const preset = gerar();
        return (
          <Chip
            key={label}
            type="button"
            aria-pressed={iguais(hours, preset)}
            disabled={disabled}
            onClick={() => onAplicar(preset)}
          >
            {label}
          </Chip>
        );
      })}
      <Chip type="button" disabled={disabled} onClick={() => onAplicar(copiarSegunda(hours))}>
        Copiar segunda para os outros dias
      </Chip>
    </Atalhos>
  );
}
