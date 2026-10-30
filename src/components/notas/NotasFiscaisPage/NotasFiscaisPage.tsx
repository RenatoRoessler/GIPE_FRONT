"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Header, Page } from "@/components/mensalistas/Mensalistas.styles";
import { Tabs } from "@/components/ui/Tabs";
import { Text } from "@/components/ui/Text";
import { mesAtual } from "@/lib/periodoNotas";
import type { PeriodoNotas } from "@/types/notaFiscal";
import { ABAS, abaUrl, parseAba, type AbaId } from "../aba";
import { FiltroPeriodo } from "@/components/ui/FiltroPeriodo";
import { Conteudo } from "../Notas.styles";
import { NotasList } from "../NotasList";
import { useNotasLancadas, useNotasPendentes } from "../useNotas";

function Pendentes() {
  const { data, isPending, isError, error, isFetching, refetch } = useNotasPendentes();
  return <NotasList tipo="pendentes" data={data} isPending={isPending} isError={isError} error={error} isFetching={isFetching} onRetry={() => void refetch()} />;
}

function Lancadas() {
  // O período começa no mês atual e só muda quando o filtro é aplicado.
  const [periodo, setPeriodo] = useState<PeriodoNotas>(() => mesAtual(new Date()));
  const { data, isPending, isError, error, isFetching, refetch } = useNotasLancadas(periodo);

  return (
    <Conteudo>
      <FiltroPeriodo periodo={periodo} onAplicar={setPeriodo} disabled={isFetching && !isError} />
      <NotasList tipo="lancadas" data={data} isPending={isPending} isError={isError} error={error} isFetching={isFetching} onRetry={() => void refetch()} />
    </Conteudo>
  );
}

export function NotasFiscaisPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const aba = parseAba(searchParams.get("aba"));

  function changeAba(next: string) {
    router.replace(abaUrl(next as AbaId), { scroll: false });
  }

  return (
    <Page>
      <Header>
        <Text variant="heading" as="h1">
          Notas Fiscais
        </Text>
      </Header>
      <Tabs tabs={[...ABAS]} value={aba} onChange={changeAba} aria-label="Seções de notas fiscais">
        {aba === "lancadas" ? <Lancadas /> : <Pendentes />}
      </Tabs>
    </Page>
  );
}
