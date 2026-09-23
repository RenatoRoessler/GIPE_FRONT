"use client";

import { Connector, Dot, Item, List, StepLabel } from "./Stepper.styles";

export interface StepperProps {
  steps: string[];
  currentStep: number;
}

export function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <List aria-label="Progresso do cadastro">
      {steps.map((label, index) => {
        const stepNumber = index + 1;
        const status =
          stepNumber < currentStep ? "done" : stepNumber === currentStep ? "current" : "pending";

        return (
          <Item key={label} aria-current={status === "current" ? "step" : undefined}>
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
            <StepLabel $status={status}>{label}</StepLabel>
            {index < steps.length - 1 && <Connector $filled={stepNumber < currentStep} />}
          </Item>
        );
      })}
    </List>
  );
}
