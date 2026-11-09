"use client";

import { useRef } from "react";
import { ErroSemPermissao } from "@/components/layout/ErroSemPermissao";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Pagination } from "@/components/ui/Pagination";
import { Skeleton } from "@/components/ui/Skeleton";
import { Text } from "@/components/ui/Text";
import { FILTRO_SITUACAO_OPTIONS, parseFiltroSituacao } from "../filtros";
import { PrecoListItem, type DirecaoFoco } from "../PrecoListItem";
import type { UsePrecos } from "../PrecosCockpit/usePrecos";
import type { PrecosUrlState } from "../PrecosCockpit/usePrecosUrlState";
import {
  Busca,
  BuscaCampo,
  Chip,
  Chips,
  Contagem,
  EstadoLista,
  Filtros,
  LegendaOculta,
  Lista,
  Raiz,
  Rodape,
  Rolagem,
  RotuloOculto,
  SkeletonItens,
} from "./PrecoListaCompleta.styles";

const SKELETON_ITENS = 8;

export interface PrecoListaCompletaProps {
  url: Pick<PrecosUrlState, "q" | "situacao" | "setQ" | "setSituacao" | "setPagina">;
  precos: UsePrecos;
  selecionadaId: number | null;
  // Escolher uma tabela: quem usa fecha a lista e mostra a tabela.
  onSelecionar: (id: number) => void;
  onNovoPreco: () => void;
}

// Todas as tabelas: busca, filtro de situação, itens com o resumo do que cobram e paginação.
export function PrecoListaCompleta({ url, precos, selecionadaId, onSelecionar, onNovoPreco }: Readonly<PrecoListaCompletaProps>) {
  const rolagemRef = useRef<HTMLDivElement>(null);
  const itensRef = useRef<(HTMLButtonElement | null)[]>([]);
  const pronto = precos.status === "pronto" ? precos : null;

  function moverFoco(indice: number, direcao: DirecaoFoco, total: number) {
    const alvo =
      direcao === "inicio" ? 0 : direcao === "fim" ? total - 1 : direcao === "proximo" ? Math.min(indice + 1, total - 1) : Math.max(indice - 1, 0);
    itensRef.current[alvo]?.focus();
  }

  function limparFiltros() {
    url.setQ("");
    url.setSituacao("todas");
  }

  function renderLista() {
    if (precos.status === "carregando") {
      return (
        <SkeletonItens role="status" aria-label="Carregando preços">
          {Array.from({ length: SKELETON_ITENS }, (_, index) => (
            <Skeleton key={index} height="44px" />
          ))}
        </SkeletonItens>
      );
    }

    if (precos.status === "erro" && precos.semPermissao) {
      return <ErroSemPermissao />;
    }

    if (precos.status === "erro") {
      return (
        <EstadoLista>
          <ErrorBanner role="alert">Não foi possível carregar os preços. {precos.erro}</ErrorBanner>
          <Button type="button" variant="secondary" onClick={precos.refetch}>
            Tentar novamente
          </Button>
        </EstadoLista>
      );
    }

    if (precos.todas.length === 0) {
      return (
        <EstadoLista>
          <Text variant="muted">Nenhuma tabela de preço cadastrada.</Text>
          <Button type="button" onClick={onNovoPreco}>
            Novo preço
          </Button>
        </EstadoLista>
      );
    }

    if (precos.filtradas.length === 0) {
      return (
        <EstadoLista>
          <Text variant="muted">Nenhuma tabela encontrada.</Text>
          <Button type="button" variant="secondary" onClick={limparFiltros}>
            Limpar busca
          </Button>
        </EstadoLista>
      );
    }

    const itens = precos.pagina.itens;
    const agora = new Date();
    // Roving tabindex: só um item entra na ordem de Tab (o selecionado, ou o primeiro).
    const indiceNoTab = Math.max(0, itens.findIndex((item) => item.rotatividadeId === selecionadaId));

    return (
      <Lista aria-label="Tabelas de preço">
        {itens.map((item, indice) => (
          <li key={item.rotatividadeId}>
            <PrecoListItem
              ref={(node) => {
                itensRef.current[indice] = node;
              }}
              preco={item}
              agora={agora}
              selecionado={item.rotatividadeId === selecionadaId}
              tabIndex={indice === indiceNoTab ? 0 : -1}
              onSelecionar={onSelecionar}
              onMoverFoco={(direcao) => moverFoco(indice, direcao, itens.length)}
            />
          </li>
        ))}
      </Lista>
    );
  }

  return (
    <Raiz>
      <Filtros>
        <RotuloOculto htmlFor="busca-precos">Buscar tabela de preço</RotuloOculto>
        <BuscaCampo>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <Busca
            id="busca-precos"
            type="search"
            placeholder="Buscar tabela de preço"
            autoComplete="off"
            value={url.q}
            onChange={(event) => url.setQ(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape" && url.q !== "") {
                event.preventDefault();
                url.setQ("");
              }
            }}
          />
        </BuscaCampo>
        <Chips>
          <LegendaOculta>Situação</LegendaOculta>
          {FILTRO_SITUACAO_OPTIONS.map((option) => (
            <Chip key={option.value} $ativo={url.situacao === option.value}>
              <input
                type="radio"
                name="situacao-precos"
                value={option.value}
                checked={url.situacao === option.value}
                onChange={(event) => url.setSituacao(parseFiltroSituacao(event.target.value))}
              />
              {option.label}
            </Chip>
          ))}
        </Chips>
        <Contagem aria-live="polite">{pronto ? pronto.contagem : " "}</Contagem>
      </Filtros>

      <Rolagem ref={rolagemRef} tabIndex={-1} $atualizando={pronto?.atualizando ?? false} aria-busy={pronto?.atualizando ?? false}>
        {renderLista()}
      </Rolagem>

      {pronto && pronto.filtradas.length > 0 && (
        <Rodape>
          <Pagination
            page={pronto.pagina.page}
            totalPages={pronto.pagina.totalPages}
            totalRecords={pronto.pagina.totalRecords}
            pageSize={pronto.pagina.pageSize}
            onPageChange={(page) => {
              url.setPagina(page);
              rolagemRef.current?.focus();
            }}
          />
        </Rodape>
      )}
    </Raiz>
  );
}
