"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ErroSemPermissao } from "@/components/layout/ErroSemPermissao";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Skeleton } from "@/components/ui/Skeleton";
import { Text } from "@/components/ui/Text";
import { Toast } from "@/components/ui/Toast";
import { DockSimulador } from "../DockSimulador";
import { EsteiraPlacas } from "../EsteiraPlacas";
import { PrecoDetalhe } from "../PrecoDetalhe";
import { PrecoListaCompleta } from "../PrecoListaCompleta";
import {
  Acoes,
  Anuncio,
  BarraModulo,
  BotaoLista,
  EstadoTela,
  Page,
  Placeholder,
  SkeletonEsteira,
  Titulo,
} from "./PrecosCockpit.styles";
import { usePrecos } from "./usePrecos";
import { usePrecosUrlState } from "./usePrecosUrlState";
import { useSelecaoPrecos } from "./useSelecaoPrecos";

export const SAVED_MESSAGES = {
  criado: "Tabela de preço criada.",
  atualizado: "Tabela de preço atualizada.",
} as const;

// Gestão de Preços: uma tabela por vez. Uma esteira de miniplacas troca de tabela, o detalhe mostra a placa
// tarifária e, no celular, o simulador fica numa barra fixa. A lista completa (busca, filtro, paginação) abre numa folha.
export function PrecosCockpit() {
  const router = useRouter();
  const url = usePrecosUrlState();
  const precos = usePrecos({ q: url.q, situacao: url.situacao, pagina: url.pagina });
  const selecao = useSelecaoPrecos(url, precos);

  const pronto = precos.status === "pronto" ? precos : null;
  const selecionada = selecao.selecionada;
  // Página fora do intervalo (ex.: registros removidos): o endereço volta para a última existente.
  const paginaForaDoIntervalo = pronto?.paginaForaDoIntervalo ?? false;
  const paginaValida = pronto?.pagina.page ?? 1;
  const { setPagina } = url;
  useEffect(() => {
    if (paginaForaDoIntervalo) {
      setPagina(paginaValida);
    }
  }, [paginaForaDoIntervalo, paginaValida, setPagina]);

  const rotuloDaLista = pronto ? `Buscar ou ver todas as tabelas (${pronto.filtradas.length})` : "Buscar tabelas";
  const savedMessage = url.salvo ? SAVED_MESSAGES[url.salvo] : undefined;

  function limparFiltros() {
    url.setQ("");
    url.setSituacao("todas");
  }

  // A tabela do endereço pode estar fora da página atual: ela aparece na frente da esteira para continuar à vista.
  function itensDaEsteira() {
    if (!pronto) {
      return [];
    }
    const itens = pronto.pagina.itens;
    return selecionada && !itens.some((item) => item.rotatividadeId === selecionada.rotatividadeId) ? [selecionada, ...itens] : itens;
  }

  function renderCorpo() {
    if (precos.status === "carregando") {
      return (
        <>
          <SkeletonEsteira role="status" aria-label="Carregando preços">
            <Skeleton height="96px" width="152px" />
            <Skeleton height="96px" width="152px" />
            <Skeleton height="96px" width="152px" />
          </SkeletonEsteira>
          <PrecoDetalhe estado="carregando" />
        </>
      );
    }

    if (precos.status === "erro" && precos.semPermissao) {
      return <ErroSemPermissao />;
    }

    if (precos.status === "erro") {
      return (
        <EstadoTela>
          <ErrorBanner role="alert">Não foi possível carregar os preços. {precos.erro}</ErrorBanner>
          <Button type="button" variant="secondary" onClick={precos.refetch}>
            Tentar novamente
          </Button>
        </EstadoTela>
      );
    }

    if (precos.todas.length === 0) {
      return (
        <EstadoTela>
          <Text variant="muted">Nenhuma tabela de preço cadastrada.</Text>
          <Button type="button" onClick={() => router.push("/precos/novo")}>
            Novo preço
          </Button>
        </EstadoTela>
      );
    }

    if (precos.filtradas.length === 0 && selecao.selecionada === null) {
      return (
        <EstadoTela>
          <Text variant="muted">Nenhuma tabela encontrada.</Text>
          <Button type="button" variant="secondary" onClick={limparFiltros}>
            Limpar busca
          </Button>
        </EstadoTela>
      );
    }

    const primeira = precos.pagina.itens[0] ?? precos.todas[0];

    return (
      <>
        <EsteiraPlacas itens={itensDaEsteira()} selecionadaId={selecionada?.rotatividadeId ?? null} onSelecionar={(id) => url.selecionar(id)} />
        {selecao.inexistente ? (
          <PrecoDetalhe estado="inexistente" onIrParaPrimeira={primeira ? () => url.selecionar(primeira.rotatividadeId) : undefined} />
        ) : selecionada ? (
          <PrecoDetalhe estado="pronto" preco={selecionada} />
        ) : (
          <Placeholder>Nenhuma tabela para mostrar.</Placeholder>
        )}
      </>
    );
  }

  return (
    <Page>
      {savedMessage && <Toast message={savedMessage} onDismiss={url.limparSalvo} />}
      <BarraModulo>
        <Titulo>Gestão de Preços</Titulo>
        <Acoes>
          <BotaoLista type="button" aria-haspopup="dialog" aria-label={rotuloDaLista} onClick={url.abrirLista}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </BotaoLista>
          <Button type="button" size="sm" aria-label="Novo preço" onClick={() => router.push("/precos/novo")}>
            + Novo
          </Button>
        </Acoes>
      </BarraModulo>

      {renderCorpo()}

      {selecionada && <DockSimulador key={selecionada.rotatividadeId} preco={selecionada} />}

      <BottomSheet open={url.listaAberta} title="Todas as tabelas" onClose={url.fecharLista}>
        {url.listaAberta && (
          <PrecoListaCompleta
            url={url}
            precos={precos}
            selecionadaId={selecionada?.rotatividadeId ?? null}
            onSelecionar={(id) => url.selecionar(id)}
            onNovoPreco={() => router.push("/precos/novo")}
          />
        )}
      </BottomSheet>

      <Anuncio role="status" aria-live="polite">
        {selecionada ? `${selecionada.descricao} selecionada` : ""}
      </Anuncio>
    </Page>
  );
}
