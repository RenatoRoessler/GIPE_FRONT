"use client";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Text } from "@/components/ui/Text";
import { getEmpresa } from "@/lib/api/services/empresa";
import { EMPRESA_QUERY_KEY, EmpresaForm } from "./EmpresaForm";
import { Page, StatusRow } from "./MinhaEmpresa.styles";
import { MinhaEmpresaSkeleton } from "./MinhaEmpresaSkeleton";

export function MinhaEmpresa() {
  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: EMPRESA_QUERY_KEY,
    queryFn: getEmpresa,
    refetchOnWindowFocus: false,
  });

  if (data) {
    return <EmpresaForm initial={data} />;
  }

  return (
    <Page>
      <Text variant="heading" as="h1">
        Minha empresa
      </Text>
      {isPending ? (
        <MinhaEmpresaSkeleton />
      ) : isError ? (
        <StatusRow>
          <ErrorBanner role="alert">{error.message}</ErrorBanner>
          <Button
            type="button"
            variant="secondary"
            onClick={() => void refetch()}
            disabled={isFetching}
          >
            Tentar novamente
          </Button>
        </StatusRow>
      ) : null}
    </Page>
  );
}
