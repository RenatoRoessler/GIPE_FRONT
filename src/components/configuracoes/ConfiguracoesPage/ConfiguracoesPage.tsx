"use client";

import { ConfiguracaoEntradaForm } from "@/components/configuracoes/ConfiguracaoEntradaForm";
import { useConfiguracao } from "@/components/configuracoes/useConfiguracao";
import { ErroSemPermissao } from "@/components/layout/ErroSemPermissao";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Skeleton } from "@/components/ui/Skeleton";
import { Text } from "@/components/ui/Text";
import { useCan } from "@/hooks/useCan";
import { isForbiddenError } from "@/lib/api/errors";
import { AREA } from "@/lib/permissoes";
import { Page, SkeletonCard, StatusRow, TitleGroup } from "./ConfiguracoesPage.styles";

const LINHAS_DO_ESQUELETO = 3;

export function ConfiguracoesPage() {
  const podeEditar = useCan(AREA.Configuracoes);
  const { configuracao, carregada, carregando, erro, refetch, isFetching } = useConfiguracao();

  return (
    <Page>
      <TitleGroup>
        <Text variant="heading" as="h1">
          Configurações
        </Text>
        <Text variant="muted">Regras da empresa para o dia a dia.</Text>
      </TitleGroup>

      {carregada ? (
        <ConfiguracaoEntradaForm initial={configuracao} podeEditar={podeEditar} />
      ) : carregando ? (
        <SkeletonCard role="status" aria-busy="true" aria-label="Carregando as configurações">
          {Array.from({ length: LINHAS_DO_ESQUELETO }, (_, indice) => (
            <Skeleton key={indice} height="56px" />
          ))}
          <Skeleton width="120px" height="44px" />
        </SkeletonCard>
      ) : isForbiddenError(erro) ? (
        <ErroSemPermissao />
      ) : (
        <StatusRow>
          <ErrorBanner role="alert">{erro?.message}</ErrorBanner>
          <Button type="button" variant="secondary" onClick={() => void refetch()} disabled={isFetching}>
            Tentar novamente
          </Button>
        </StatusRow>
      )}
    </Page>
  );
}
