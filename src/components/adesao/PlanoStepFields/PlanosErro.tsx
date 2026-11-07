"use client";

import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { ErroPlanos, ErroTitulo } from "./PlanoStepFields.styles";

export interface PlanosErroProps {
  onRetry: () => void;
  // Nova tentativa em andamento. O bloco continua montado, então o foco não se perde do botão.
  refazendo?: boolean;
}

export function PlanosErro({ onRetry, refazendo = false }: PlanosErroProps) {
  return (
    <ErrorBanner role="alert">
      <ErroPlanos>
        <ErroTitulo>Não conseguimos carregar os planos</ErroTitulo>
        <span>Isso é do nosso lado, não dos seus dados. Tente de novo em instantes.</span>
        <Button type="button" variant="secondary" size="sm" onClick={onRetry} aria-busy={refazendo}>
          {refazendo ? "Tentando de novo…" : "Tentar de novo"}
        </Button>
      </ErroPlanos>
    </ErrorBanner>
  );
}
