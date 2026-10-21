"use client";

import { Item, Label, List, Mark, VisuallyHidden } from "./StageTrack.styles";

export type StageState = "done" | "current" | "attention" | "todo";

export interface StageTrackProps {
  stages: { label: string; state: StageState }[];
  // sm: só as marcas (rótulos ficam para o leitor de tela); md: rótulos visíveis.
  size?: "sm" | "md";
  // success: a trilha toda na cor de sucesso (ex.: mensalista ativo).
  tone?: "default" | "success";
  // Nome acessível do conjunto.
  label: string;
}

const STATE_TEXT: Record<StageState, string> = {
  done: "concluída",
  current: "atual",
  attention: "requer atenção",
  todo: "pendente",
};

// Indicador de situação (não conduz um passo a passo, ao contrário do Stepper).
export function StageTrack({ stages, size = "md", tone = "default", label }: StageTrackProps) {
  return (
    <List aria-label={label} $size={size}>
      {stages.map((stage) => (
        <Item
          key={stage.label}
          $size={size}
          $state={stage.state}
          $tone={tone}
          aria-current={stage.state === "current" ? "step" : undefined}
        >
          <Mark $state={stage.state} $size={size} $tone={tone} aria-hidden="true">
            {stage.state === "attention" && (
              <svg viewBox="0 0 10 10" width="100%" height="100%" aria-hidden="true">
                <path d="M5 2v3.2M5 7.2v.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none" />
              </svg>
            )}
          </Mark>
          {size === "md" ? (
            <Label $state={stage.state}>{stage.label}</Label>
          ) : (
            <VisuallyHidden>{stage.label}</VisuallyHidden>
          )}
          <VisuallyHidden>{`: ${STATE_TEXT[stage.state]}`}</VisuallyHidden>
        </Item>
      ))}
    </List>
  );
}
