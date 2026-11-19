"use client";

import { ComponentPropsWithoutRef } from "react";
import { Fill, Track, type ProgressBarTone } from "./ProgressBar.styles";

export interface ProgressBarProps extends Omit<ComponentPropsWithoutRef<"div">, "children" | "role"> {
  value: number;
  max: number;
  // Nome acessível: a barra sozinha não diz do que é o progresso.
  "aria-label": string;
  // Cor do preenchimento: verde de sucesso (padrão) ou o amarelo da marca, para medidas que não são "bom" ou "ruim" (ocupação).
  tone?: ProgressBarTone;
}

// O valor numérico fica no texto da tela ao lado; a barra e a cor só reforçam.
export function ProgressBar({ value, max, tone = "success", ...props }: ProgressBarProps) {
  const limite = Math.max(0, max);
  const atual = Math.min(Math.max(0, value), limite);
  const ratio = limite > 0 ? atual / limite : 0;

  return (
    <Track role="progressbar" aria-valuemin={0} aria-valuemax={limite} aria-valuenow={atual} {...props}>
      <Fill $ratio={ratio} $tone={tone} />
    </Track>
  );
}
