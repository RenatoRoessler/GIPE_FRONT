"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useConveniadas } from "@/components/conveniadas/useConveniadas";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { useIsMobile } from "@/hooks/useMediaQuery";
import type { FaturaFiltros } from "@/types/fatura";
import { EmitirFaturaModal } from "../EmitirFaturaModal";
import { Header, Page } from "../Faturas.styles";
import { EmitirFlutuante, PaginaComFab } from "../FaturasMobile.styles";
import { FaturasLista } from "../FaturasLista";
import { FiltrosFaturas } from "../FiltrosFaturas";
import { faturaUrl, filtrosUrl, parseFiltros, SEM_FILTROS } from "../url";
import { useFaturas } from "../useFaturas";

export function FaturasPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const celular = useIsMobile();
  const filtros = useMemo(() => parseFiltros(searchParams), [searchParams]);
  const conveniadas = useConveniadas("todos");
  // Mesma consulta da lista (mesma chave): só para saber se o estado vazio já oferece o botão de emitir.
  const faturas = useFaturas(filtros);
  const [emitindo, setEmitindo] = useState(false);

  // Trocar um filtro volta à primeira página.
  function aplicar(proximo: FaturaFiltros) {
    router.replace(filtrosUrl(proximo), { scroll: false });
  }

  const semFiltro = filtros.empresaConveniadaId === null && filtros.situacao === null;
  const vazioSemFiltro = semFiltro && faturas.data?.items.length === 0;
  // No celular o botão flutua; no estado vazio sem filtro o próprio aviso já traz o botão.
  const comFlutuante = celular && !vazioSemFiltro;
  const Container = comFlutuante ? PaginaComFab : Page;

  return (
    <Container>
      <Header>
        <Text variant="heading" as="h1">
          Faturas
        </Text>
        {!celular && (
          <Button type="button" onClick={() => setEmitindo(true)}>
            Emitir fatura
          </Button>
        )}
      </Header>
      <FiltrosFaturas filtros={filtros} conveniadas={conveniadas.data ?? []} onChange={aplicar} />
      <FaturasLista
        filtros={filtros}
        onPaginaChange={(pagina) => aplicar({ ...filtros, pagina })}
        onEmitir={() => setEmitindo(true)}
        onLimparFiltros={() => aplicar(SEM_FILTROS)}
      />
      {comFlutuante && (
        <EmitirFlutuante type="button" onClick={() => setEmitindo(true)}>
          Emitir fatura
        </EmitirFlutuante>
      )}
      {emitindo && (
        <EmitirFaturaModal
          onClose={() => setEmitindo(false)}
          // O aviso de emissão aparece no detalhe, que lê a marca na URL.
          onEmitida={(detalhe) => router.push(faturaUrl(detalhe.fatura.convenioFaturaId, true))}
        />
      )}
    </Container>
  );
}
