"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useTheme } from "styled-components";
import { ErroSemPermissao } from "@/components/layout/ErroSemPermissao";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { Text } from "@/components/ui/Text";
import { Toast } from "@/components/ui/Toast";
import { FILTRO_SITUACAO_OPTIONS, parseFiltroSituacao } from "../filtros";
import { PrecoDetalhe } from "../PrecoDetalhe";
import { PrecoListItem, type DirecaoFoco } from "../PrecoListItem";
import {
  Anuncio,
  Busca,
  ColunaDetalhe,
  ColunaLista,
  Contagem,
  EstadoLista,
  Filtros,
  Header,
  Lista,
  Moldura,
  Page,
  Placeholder,
  Rodape,
  Rolagem,
  RotuloOculto,
  SkeletonItens,
} from "./PrecosMasterDetail.styles";
import { usePrecos } from "./usePrecos";
import { usePrecosUrlState } from "./usePrecosUrlState";
import { useSelecaoPrecos } from "./useSelecaoPrecos";

const SKELETON_ITENS = 8;

export const SAVED_MESSAGES = {
  criado: "Tabela de preço criada.",
  atualizado: "Tabela de preço atualizada.",
} as const;

export function PrecosMasterDetail() {
  const router = useRouter();
  const theme = useTheme();
  const url = usePrecosUrlState();
  const precos = usePrecos({ q: url.q, situacao: url.situacao, pagina: url.pagina });
  const selecao = useSelecaoPrecos(url, precos);
  const rolagemRef = useRef<HTMLDivElement>(null);
  const itensRef = useRef<(HTMLButtonElement | null)[]>([]);

  const pronto = precos.status === "pronto" ? precos : null;

  // Página fora do intervalo (ex.: registros removidos): o endereço volta para a última existente.
  const paginaForaDoIntervalo = pronto?.paginaForaDoIntervalo ?? false;
  const paginaValida = pronto?.pagina.page ?? 1;
  const { setPagina } = url;
  useEffect(() => {
    if (paginaForaDoIntervalo) {
      setPagina(paginaValida);
    }
  }, [paginaForaDoIntervalo, paginaValida, setPagina]);

  // No celular, abrir o detalhe cria uma entrada no histórico para o botão Voltar do navegador devolver a lista.
  function selecionar(id: number) {
    const celular = window.matchMedia?.(`(max-width: ${Number.parseInt(theme.breakpoints.md, 10) - 1}px)`).matches ?? false;
    url.selecionar(id, { push: celular });
  }

  function moverFoco(indice: number, direcao: DirecaoFoco, total: number) {
    const alvo =
      direcao === "inicio" ? 0 : direcao === "fim" ? total - 1 : direcao === "proximo" ? Math.min(indice + 1, total - 1) : Math.max(indice - 1, 0);
    itensRef.current[alvo]?.focus();
  }

  function limparFiltros() {
    url.setQ("");
    url.setSituacao("todas");
  }

  const savedMessage = url.salvo ? SAVED_MESSAGES[url.salvo] : undefined;

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
          <Button type="button" onClick={() => router.push("/precos/novo")}>
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
    const indiceNoTab = Math.max(0, itens.findIndex((item) => item.rotatividadeId === selecao.selecionada?.rotatividadeId));

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
              selecionado={item.rotatividadeId === selecao.selecionada?.rotatividadeId}
              tabIndex={indice === indiceNoTab ? 0 : -1}
              onSelecionar={selecionar}
              onMoverFoco={(direcao) => moverFoco(indice, direcao, itens.length)}
            />
          </li>
        ))}
      </Lista>
    );
  }

  function renderDetalhe() {
    if (precos.status === "carregando") {
      return <PrecoDetalhe estado="carregando" />;
    }
    if (precos.status === "erro") {
      return <Placeholder>Os detalhes aparecem aqui quando as tabelas carregarem.</Placeholder>;
    }
    if (selecao.inexistente) {
      const primeira = precos.pagina.itens[0] ?? precos.todas[0];
      return (
        <PrecoDetalhe
          estado="inexistente"
          onIrParaPrimeira={primeira ? () => url.selecionar(primeira.rotatividadeId) : undefined}
          onVoltar={() => url.selecionar(null)}
        />
      );
    }
    if (selecao.selecionada) {
      return <PrecoDetalhe estado="pronto" preco={selecao.selecionada} onVoltar={() => url.selecionar(null)} />;
    }
    return <Placeholder>Nenhuma tabela para mostrar.</Placeholder>;
  }

  return (
    <Page>
      {savedMessage && <Toast message={savedMessage} onDismiss={url.limparSalvo} />}
      <Header>
        <Text variant="heading" as="h1">
          Gestão de Preços
        </Text>
        <Button type="button" onClick={() => router.push("/precos/novo")}>
          Novo preço
        </Button>
      </Header>

      <Moldura $detalheAberto={selecao.detalheAberto}>
        <ColunaLista $detalheAberto={selecao.detalheAberto} aria-label="Lista de tabelas de preço">
          <Filtros>
            <RotuloOculto htmlFor="busca-precos">Buscar tabela de preço</RotuloOculto>
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
            <Select
              label="Situação"
              value={url.situacao}
              onChange={(event) => url.setSituacao(parseFiltroSituacao(event.target.value))}
            >
              {FILTRO_SITUACAO_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Contagem aria-live="polite">{pronto ? pronto.contagem : " "}</Contagem>
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
        </ColunaLista>

        <ColunaDetalhe $detalheAberto={selecao.detalheAberto} aria-label="Detalhe da tabela de preço">
          {renderDetalhe()}
        </ColunaDetalhe>
      </Moldura>

      <Anuncio role="status" aria-live="polite">
        {selecao.selecionada ? `${selecao.selecionada.descricao} selecionada` : ""}
      </Anuncio>
    </Page>
  );
}
