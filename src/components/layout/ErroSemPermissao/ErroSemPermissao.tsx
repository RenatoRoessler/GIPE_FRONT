"use client";

import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Link } from "@/components/ui/Link";
import { Area } from "./ErroSemPermissao.styles";

export interface ErroSemPermissaoProps {
  message?: string;
}

// A API recusou por permissão (403) ao carregar uma tela: tentar de novo não resolve, então a saída é voltar ao início.
export function ErroSemPermissao({ message = "Você não tem permissão para acessar esta página." }: ErroSemPermissaoProps) {
  return (
    <Area>
      <ErrorBanner role="alert">{message}</ErrorBanner>
      <Link href="/dashboard">Ir para o início</Link>
    </Area>
  );
}
