"use client";

import { ComponentPropsWithoutRef } from "react";
import { Fill, Track } from "./ProgressBar.styles";

export interface ProgressBarProps extends Omit<ComponentPropsWithoutRef<"div">, "children" | "role"> {
  value: number;
  max: number;
  // Nome acessível: a barra sozinha não diz do que é o progresso.
  "aria-label": string;
}

// O valor numérico fica no texto da tela ao lado; a barra e a cor só reforçam.
export function ProgressBar({ value, max, ...props }: ProgressBarProps) {
  const limite = Math.max(0, max);
  const atual = Math.min(Math.max(0, value), limite);
  const ratio = limite > 0 ? atual / limite : 0;

  return (
    <Track role="progressbar" aria-valuemin={0} aria-valuemax={limite} aria-valuenow={atual} {...props}>
      <Fill $ratio={ratio} />
    </Track>
  );
}
