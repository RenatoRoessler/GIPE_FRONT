"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { nomeExibido } from "@/components/conveniadas/format";
import { useConveniadas } from "@/components/conveniadas/useConveniadas";
import { Button } from "@/components/ui/Button";
import { OptionGroup } from "@/components/ui/OptionGroup";
import { Select } from "@/components/ui/Select";
import { Text } from "@/components/ui/Text";
import type { FaturaFiltros, SituacaoFatura } from "@/types/fatura";
import { EmitirFaturaModal } from "../EmitirFaturaModal";
import { Filtros, Header, Page } from "../Faturas.styles";
import { FaturasLista } from "../FaturasLista";
import { SITUACOES_FATURA } from "../situacao";
import { faturaUrl, filtrosUrl, parseFiltros, SEM_FILTROS } from "../url";

// "" representa "Todas" nos grupos de opção, que trabalham com texto.
const TODAS = "";

export function FaturasPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filtros = useMemo(() => parseFiltros(searchParams), [searchParams]);
  const conveniadas = useConveniadas("todos");
  const [emitindo, setEmitindo] = useState(false);

  // Trocar um filtro volta à primeira página.
  function aplicar(proximo: FaturaFiltros) {
    router.replace(filtrosUrl(proximo), { scroll: false });
  }

  function mudarConveniada(valor: string) {
    aplicar({ ...filtros, empresaConveniadaId: valor === TODAS ? null : Number(valor), pagina: 1 });
  }

  function mudarSituacao(valor: string) {
    aplicar({ ...filtros, situacao: valor === TODAS ? null : (Number(valor) as SituacaoFatura), pagina: 1 });
  }

  const opcoesSituacao = SITUACOES_FATURA.map((opcao) => ({ value: opcao.value === null ? TODAS : String(opcao.value), label: opcao.label }));

  return (
    <Page>
      <Header>
        <Text variant="heading" as="h1">
          Faturas
        </Text>
        <Button type="button" onClick={() => setEmitindo(true)}>
          Emitir fatura
        </Button>
      </Header>
      <Filtros>
        <Select label="Conveniada" value={filtros.empresaConveniadaId === null ? TODAS : String(filtros.empresaConveniadaId)} onChange={(evento) => mudarConveniada(evento.target.value)}>
          <option value={TODAS}>Todas</option>
          {(conveniadas.data ?? []).map((conveniada) => (
            <option key={conveniada.empresaConveniadaId} value={conveniada.empresaConveniadaId}>
              {nomeExibido(conveniada)}
              {conveniada.ativo ? "" : " (encerrado)"}
            </option>
          ))}
        </Select>
        <OptionGroup
          legend="Situação"
          options={opcoesSituacao}
          value={filtros.situacao === null ? TODAS : String(filtros.situacao)}
          onChange={mudarSituacao}
          columns={SITUACOES_FATURA.length}
        />
      </Filtros>
      <FaturasLista
        filtros={filtros}
        onPaginaChange={(pagina) => aplicar({ ...filtros, pagina })}
        onEmitir={() => setEmitindo(true)}
        onLimparFiltros={() => aplicar(SEM_FILTROS)}
      />
      {emitindo && (
        <EmitirFaturaModal
          onClose={() => setEmitindo(false)}
          // O aviso de emissão aparece no detalhe, que lê a marca na URL.
          onEmitida={(detalhe) => router.push(faturaUrl(detalhe.fatura.convenioFaturaId, true))}
        />
      )}
    </Page>
  );
}
