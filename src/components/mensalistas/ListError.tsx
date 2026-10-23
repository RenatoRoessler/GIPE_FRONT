"use client";

import { Button } from "@/components/ui/Button";
import { ErroSemPermissao } from "@/components/layout/ErroSemPermissao";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { isForbiddenError } from "@/lib/api/errors";
import { ErrorArea } from "./Mensalistas.styles";

export interface ListErrorProps {
  error: Error;
  what: string;
  onRetry: () => void;
  retrying?: boolean;
}

// 403 não melhora ao tentar de novo: mostra só o aviso de permissão.
export function ListError({ error, what, onRetry, retrying = false }: ListErrorProps) {
  if (isForbiddenError(error)) {
    return <ErroSemPermissao />;
  }

  return (
    <ErrorArea>
      <ErrorBanner role="alert">
        Não foi possível carregar {what}. {error.message}
      </ErrorBanner>
      <Button type="button" variant="secondary" onClick={onRetry} disabled={retrying}>
        Tentar novamente
      </Button>
    </ErrorArea>
  );
}
