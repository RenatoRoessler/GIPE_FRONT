"use client";

import styled from "styled-components";
import { Button } from "@/components/ui/Button";
import { useOnboardingTour } from "../OnboardingProvider";

// Ícone e texto lado a lado, como o botão do cartaz.
const Botao = styled(Button)`
  gap: ${({ theme }) => theme.space[2]}px;
`;

function PlayIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M10 8.5l5 3.5-5 3.5z" />
    </svg>
  );
}

// Reabre o tour de boas-vindas completo, mesmo já visto. Serve à Home e à tela do Carimbo (a conveniada não tem Home).
export function RepetirTourButton() {
  const { abrirTour } = useOnboardingTour();

  return (
    <Botao type="button" variant="secondary" aria-haspopup="dialog" onClick={abrirTour}>
      <PlayIcon />
      Repetir tour
    </Botao>
  );
}
