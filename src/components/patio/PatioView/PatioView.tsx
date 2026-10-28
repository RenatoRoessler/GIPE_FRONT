"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { formatTime } from "@/components/caixa/format";
import { ListError } from "@/components/mensalistas/ListError";
import { useQuadros } from "@/components/quadros/useQuadros";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Toast } from "@/components/ui/Toast";
import { useVeiculoModais } from "@/components/veiculos/VeiculoModais";
import type { PatioVeiculo } from "@/types/patio";
import { BarrasHorizontais, ChegadasPorHora } from "../graficos";
import { chegadasPorHora, contarForaDoQuadro, contarNoQuadro, estatisticasPatio, filtrarPatio, ocupacaoPatio, ordenarPatio } from "../patio";
import { PARAM_SAIU } from "../patioUrl";
import { useEstacionamento } from "../useEstacionamento";
import { usePatio } from "../usePatio";
import { usePatioFiltros } from "../usePatioFiltros";
import { useVagasPatio } from "../useVagasPatio";
import { IndicadorChaves } from "./IndicadorChaves";
import { BUSCA_ID, PatioFiltros } from "./PatioFiltros";
import { PatioLista } from "./PatioLista";
import { PatioResumo } from "./PatioResumo";
import {
  Anuncio,
  AtualizarBotao,
  Atualizacao,
  Conteudo,
  EsqueletoLinha,
  GraficosDetalhes,
  GraficosGrade,
  Hora,
  Indicadores,
  MaisBotao,
  ResumoGrade,
  Subtitulo,
  Titulo,
  Topo,
  Vazio,
  VagaIcone,
} from "./PatioView.styles";

const LIMITE_INICIAL = 100;
const ESQUELETO_CARDS = 6;
const RELOGIO_MS = 30_000;

// Hora do topo: nasce vazia (o servidor e o navegador não concordam sobre a hora) e acompanha o relógio a cada 30 segundos.
function Relogio() {
  const [agora, setAgora] = useState<number | null>(null);

  useEffect(() => {
    const atualizar = () => setAgora(Date.now());
    const inicio = setTimeout(atualizar, 0);
    const intervalo = setInterval(atualizar, RELOGIO_MS);
    return () => {
      clearTimeout(inicio);
      clearInterval(intervalo);
    };
  }, []);

  // Decorativo: o leitor de tela não precisa ouvir a hora mudar.
  return <Hora aria-hidden="true">{agora === null ? "" : formatTime(new Date(agora).toISOString())}</Hora>;
}

function PatioTopo({ estacionamento }: { estacionamento: string | null }) {
  return (
    <Topo>
      <div>
        <Titulo>Pátio</Titulo>
        {estacionamento && <Subtitulo>{estacionamento}</Subtitulo>}
      </div>
      <Relogio />
    </Topo>
  );
}

// Esqueleto da lista no formato final; também serve de reserva do Suspense da página.
export function PatioEsqueleto() {
  return (
    <Conteudo>
      <PatioTopo estacionamento={null} />
      <div role="status" aria-label="Carregando o pátio">
        <EsqueletoLinha>
          <Skeleton height="132px" radius="18px" />
          <Skeleton height="48px" radius="10px" />
          {Array.from({ length: ESQUELETO_CARDS }, (_, indice) => (
            <Skeleton key={indice} height="104px" radius="14px" />
          ))}
        </EsqueletoLinha>
      </div>
    </Conteudo>
  );
}

export function PatioView() {
  const { data, isPending, isError, error, refetch, isFetching, dataUpdatedAt } = usePatio();
  // Falha ou carregamento dos quadros não derruba o Pátio: sem a lista, só somem a chave dos cards e o indicador.
  const { data: quadros } = useQuadros();
  const comQuadros = (quadros?.length ?? 0) > 0;
  const semQuadros = quadros !== undefined && quadros.length === 0;
  const vagas = useVagasPatio();
  const estacionamento = useEstacionamento();
  const { abrirEntrada } = useVeiculoModais();
  const { busca, setBusca, termo, tipo, setTipo, categoria, setCategoria, chave, setChave, limparFiltros, limparBusca, filtros } = usePatioFiltros();

  // A saída é concluída no ticket, que volta para cá com `?saiu=PLACA`. O aviso nasce uma vez; o parâmetro some da URL
  // quando `usePatioFiltros` reescreve a query só com os filtros.
  const searchParams = useSearchParams();
  const [aviso, setAviso] = useState<string | null>(() => {
    const placa = searchParams.get(PARAM_SAIU);
    return placa ? `${placa} saiu do pátio.` : null;
  });
  const focoPendente = useRef(aviso !== null);
  const conteudo = useRef<HTMLDivElement>(null);

  // Quantas linhas a mais o operador pediu para esta combinação de busca e filtros: ao mudar a combinação, volta a 100.
  const [expandido, setExpandido] = useState({ chave: "", extra: 0 });

  const todos = data ?? [];
  const ordenados = ordenarPatio(todos);
  const visiveis = filtrarPatio(ordenados, filtros);
  const estatisticas = estatisticasPatio(todos);
  const ocupacao = vagas ? ocupacaoPatio(todos, vagas) : null;
  const combinacao = `${termo}|${tipo}|${categoria}|${chave}`;
  const limite = LIMITE_INICIAL + (expandido.chave === combinacao ? expandido.extra : 0);
  const mostradas: PatioVeiculo[] = visiveis.slice(0, limite);
  const filtrando = termo !== "" || tipo !== "todos" || categoria !== "todas" || chave !== "todas";

  // Depois da saída o veículo some: o foco vai ao primeiro card (ou à busca, se a lista esvaziou) e não se perde.
  const carregado = data !== undefined;
  const primeiroPatioId = mostradas[0]?.patioId ?? null;
  useEffect(() => {
    if (!focoPendente.current || !carregado) return;
    focoPendente.current = false;
    const card = conteudo.current?.querySelector<HTMLElement>("[data-patio-card]");
    (card ?? document.getElementById(BUSCA_ID))?.focus();
  }, [carregado, primeiroPatioId]);

  const extras = (
    <>
      <Anuncio role="status">{aviso ?? ""}</Anuncio>
      {aviso && <Toast message={aviso} variant="success" onDismiss={() => setAviso(null)} />}
    </>
  );

  // Uma falha ao atualizar não derruba a lista que já está na tela.
  if (isError && data === undefined) {
    return (
      <Conteudo ref={conteudo}>
        <PatioTopo estacionamento={estacionamento} />
        <ListError error={error} what="o pátio" onRetry={() => void refetch()} retrying={isFetching} />
        {extras}
      </Conteudo>
    );
  }

  if (isPending) {
    return (
      <>
        <PatioEsqueleto />
        {extras}
      </>
    );
  }

  const vazio = todos.length === 0;

  return (
    <Conteudo ref={conteudo}>
      <PatioTopo estacionamento={estacionamento} />

      <ResumoGrade>
        <PatioResumo veiculos={todos} ocupacao={ocupacao} tipo={tipo} onTipoChange={setTipo} />
        {!vazio && (
          <PatioFiltros
            busca={busca}
            onBuscaChange={setBusca}
            tipo={tipo}
            categoria={categoria}
            onCategoriaChange={setCategoria}
            chave={chave}
            onChaveChange={setChave}
            chaves={comQuadros ? { fora: contarForaDoQuadro(todos), dentro: contarNoQuadro(todos) } : null}
            onLimparFiltros={limparFiltros}
            estatisticas={estatisticas}
          />
        )}
      </ResumoGrade>

      {!vazio && (
        <Atualizacao>
          <Indicadores>
            <span role="status">
              {filtrando ? `${visiveis.length} de ${todos.length} veículos` : `${todos.length} ${todos.length === 1 ? "veículo no pátio" : "veículos no pátio"}`}
            </span>
            <IndicadorChaves foraDoQuadro={contarForaDoQuadro(todos)} comQuadros={comQuadros} semQuadros={semQuadros} />
            <span>{`Atualizado às ${formatTime(new Date(dataUpdatedAt).toISOString())}`}</span>
          </Indicadores>
          <AtualizarBotao type="button" variant="secondary" size="sm" disabled={isFetching} onClick={() => void refetch()}>
            {isFetching ? "Atualizando…" : "Atualizar"}
          </AtualizarBotao>
        </Atualizacao>
      )}

      {vazio ? (
        <Vazio>
          <VagaIcone aria-hidden="true" />
          <b>Nenhum carro no pátio</b>
          <p>As entradas aparecem aqui assim que forem registradas.</p>
          <Button type="button" onClick={abrirEntrada}>
            Registrar entrada
          </Button>
        </Vazio>
      ) : visiveis.length === 0 ? (
        <Vazio>
          <VagaIcone aria-hidden="true" />
          <b role="status">{termo !== "" ? "Nenhum carro encontrado" : "Nenhum veículo com esses filtros"}</b>
          <p>{termo !== "" ? `Nada encontrado para “${termo}”. Confira a placa, o modelo ou o ticket digitado.` : "Tire algum filtro para ver os outros veículos."}</p>
          {termo !== "" && (
            <Button type="button" variant="secondary" onClick={limparBusca}>
              Limpar busca
            </Button>
          )}
          {(tipo !== "todos" || categoria !== "todas" || chave !== "todas") && (
            <Button type="button" variant="secondary" onClick={limparFiltros}>
              Limpar filtros
            </Button>
          )}
        </Vazio>
      ) : (
        <>
          <PatioLista veiculos={mostradas} filtros={filtros} comQuadros={comQuadros} atualizando={isFetching} />
          {visiveis.length > mostradas.length && (
            <MaisBotao
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setExpandido({ chave: combinacao, extra: (expandido.chave === combinacao ? expandido.extra : 0) + LIMITE_INICIAL })}
            >
              {`Mostrar mais ${Math.min(LIMITE_INICIAL, visiveis.length - mostradas.length)}`}
            </MaisBotao>
          )}
        </>
      )}

      {!vazio && (
        <GraficosDetalhes>
          <summary>Ver gráficos do pátio</summary>
          <GraficosGrade>
            <BarrasHorizontais titulo="Tempo no pátio" itens={estatisticas.porPermanencia} />
            <BarrasHorizontais titulo="Por operador de entrada" itens={estatisticas.porOperador} />
            <ChegadasPorHora chegadas={chegadasPorHora(todos)} />
          </GraficosGrade>
        </GraficosDetalhes>
      )}
      {extras}
    </Conteudo>
  );
}
