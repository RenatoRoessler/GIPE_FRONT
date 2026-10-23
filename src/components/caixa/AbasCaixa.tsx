"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ErroSemPermissao } from "@/components/layout/ErroSemPermissao";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Skeleton } from "@/components/ui/Skeleton";
import { Tabs } from "@/components/ui/Tabs";
import { isForbiddenError } from "@/lib/api/errors";
import type { Caixa, Movimento, Turno } from "@/types/caixa";
import { ABAS, abaUrl, parseAba, type AbaId } from "./aba";
import { StatusRow, VisuallyHidden } from "./Caixa.styles";
import { montarLinhaDoTempo } from "./eventosCaixa";
import { GraficosCaixa } from "./GraficosCaixa";
import { LinhaDoTempo } from "./LinhaDoTempo";
import { MovimentosLista } from "./MovimentosLista";

// O que as abas precisam de uma consulta: não depende do tipo exato do React Query.
export interface ConsultaCaixa<T> {
  data: T | undefined;
  isError: boolean;
  error: Error | null;
  refetch: () => unknown;
}

export interface AbasCaixaProps {
  caixa: Caixa;
  movimentos: ConsultaCaixa<Movimento[]>;
  turnos: ConsultaCaixa<Turno[]>;
}

function Carregando({ texto }: { texto: string }) {
  return (
    <div role="status" aria-busy="true">
      <VisuallyHidden>{texto}</VisuallyHidden>
      <Skeleton height="120px" />
    </div>
  );
}

function Falha({ error, onRetry }: { error: Error | null; onRetry: () => void }) {
  if (error && isForbiddenError(error)) {
    return <ErroSemPermissao />;
  }
  return (
    <StatusRow>
      <ErrorBanner role="alert">{error?.message ?? "Não foi possível carregar os dados do caixa."}</ErrorBanner>
      <Button type="button" variant="secondary" onClick={onRetry}>
        Tentar novamente
      </Button>
    </StatusRow>
  );
}

// Movimentos, linha do tempo e gráficos do caixa aberto; a aba ativa fica na URL (?aba=).
export function AbasCaixa({ caixa, movimentos, turnos }: AbasCaixaProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const aba = parseAba(searchParams.get("aba"));

  function trocarAba(proxima: string) {
    router.replace(abaUrl(proxima as AbaId), { scroll: false });
  }

  function conteudo() {
    if (aba === "movimentos") {
      return (
        <MovimentosLista
          movimentos={movimentos.data}
          turnos={turnos.data}
          isError={movimentos.isError}
          error={movimentos.error}
          onRetry={() => void movimentos.refetch()}
        />
      );
    }

    const falha = movimentos.isError ? movimentos : turnos.isError ? turnos : null;
    if (falha) {
      return <Falha error={falha.error} onRetry={() => void falha.refetch()} />;
    }

    if (aba === "graficos") {
      return movimentos.data === undefined ? <Carregando texto="Carregando gráficos…" /> : <GraficosCaixa movimentos={movimentos.data} />;
    }

    if (movimentos.data === undefined || turnos.data === undefined) {
      return <Carregando texto="Carregando a linha do tempo…" />;
    }
    return <LinhaDoTempo eventos={montarLinhaDoTempo(caixa, turnos.data, movimentos.data)} />;
  }

  return (
    <Tabs tabs={[...ABAS]} value={aba} onChange={trocarAba} aria-label="Atividade do caixa">
      {conteudo()}
    </Tabs>
  );
}
