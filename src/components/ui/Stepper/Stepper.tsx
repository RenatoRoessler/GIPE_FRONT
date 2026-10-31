"use client";

import { Connector, Dot, Item, List, StepButton, StepLabel } from "./Stepper.styles";

export interface StepperProps {
  steps: string[];
  currentStep: number;
  // Nome acessível da lista; o padrão serve ao cadastro.
  label?: string;
  // Torna as etapas já concluídas clicáveis (voltar a uma etapa); as futuras nunca são.
  onStepClick?: (step: number) => void;
  // Mostra só o nome da etapa atual (telas estreitas).
  compact?: boolean;
}

export function Stepper({
  steps,
  currentStep,
  label: listLabel = "Progresso do cadastro",
  onStepClick,
  compact = false,
}: StepperProps) {
  return (
    <List aria-label={listLabel}>
      {steps.map((label, index) => {
        const stepNumber = index + 1;
        const status =
          stepNumber < currentStep ? "done" : stepNumber === currentStep ? "current" : "pending";

        const content = (
          <>
            <Dot $status={status}>
              {status === "done" ? (
                <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true">
                  <path
                    d="M3.5 8.5l3 3 6-6.5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                stepNumber
              )}
            </Dot>
            <StepLabel $status={status} $hidden={compact && status !== "current"}>
              {label}
            </StepLabel>
          </>
        );

        return (
          <Item key={label} aria-current={status === "current" ? "step" : undefined}>
            {onStepClick && status === "done" ? (
              <StepButton
                type="button"
                aria-label={`Voltar para ${label}`}
                onClick={() => onStepClick(stepNumber)}
              >
                {content}
              </StepButton>
            ) : (
              content
            )}
            {index < steps.length - 1 && <Connector $filled={stepNumber < currentStep} />}
          </Item>
        );
      })}
    </List>
  );
}
