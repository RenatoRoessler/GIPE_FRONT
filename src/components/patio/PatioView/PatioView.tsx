"use client";

import { Fragment, useRef, useState } from "react";
import { formatTime } from "@/components/caixa/format";
import { ListError } from "@/components/mensalistas/ListError";
import { EmptyState } from "@/components/mensalistas/Mensalistas.styles";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Text } from "@/components/ui/Text";
import { Toast } from "@/components/ui/Toast";
import { SaidaVeiculoModal } from "@/components/veiculos/SaidaVeiculoModal";
import { useVeiculoModais } from "@/components/veiculos/VeiculoModais";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useFocoAposRemocao, vizinhosDe } from "@/hooks/useFocoAposRemocao";
import { useToast } from "@/hooks/useToast";
import type { PatioFiltroTipo, PatioVeiculo } from "@/types/patio";
import { BarrasHorizontais, ChegadasPorHora } from "../graficos";
import { chegadasPorHora, estatisticasPatio, filtrarPatio, formatarMinutos, ocupacaoPatio, ordenarPatio, resumirPatio } from "../patio";
import { usePatio } from "../usePatio";
import { useVagasPatio } from "../useVagasPatio";
import { BUSCA_ID, PatioFiltros } from "./PatioFiltros";
import { PatioTabela } from "./PatioTabela";
import {
  Anuncio,
  AtualizarBotao,
  Cabecalho,
  Conteudo,
  EsqueletoLinha,
  GraficosDetalhes,
  GraficosGrade,
  MaisBotao,
  Resumo,
} from "./PatioView.styles";

const DEBOUNCE_MS = 250;
const LIMITE_INICIAL = 100;
const ESQUELETO_LINHAS = 8;

export function PatioView() {
  // Com o modal de saída aberto a lista não se atualiza sozinha: ela não pode mudar enquanto o operador recebe o pagamento.
  const [saida, setSaida] = useState<PatioVeiculo | null>(null);
  const { data, isPending, isError, error, refetch, isFetching, dataUpdatedAt } = usePatio({ pausado: saida !== null });
  const vagas = useVagasPatio();
  const { toast, showToast, dismissToast } = useToast();
  const { abrirEntrada } = useVeiculoModais();
  const conteudo = useRef<HTMLDivElement>(null);
  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState<PatioFiltroTipo>("todos");
  const [categoria, setCategoria] = useState<number | "todas">("todas");
  // Quantas linhas a mais o operador pediu para esta combinação de busca e filtros: ao mudar a combinação, volta a 100.
  const [expandido, setExpandido] = useState({ chave: "", extra: 0 });
  const termo = useDebouncedValue(busca.trim(), DEBOUNCE_MS);

  const todos = data ?? [];
  const ordenados = ordenarPatio(todos);
  const visiveis = filtrarPatio(ordenados, { busca: termo, tipo, categoria });
  const resumo = resumirPatio(todos, visiveis);
  const estatisticas = estatisticasPatio(todos);
  const ocupacao = vagas ? ocupacaoPatio(todos, vagas) : null;
  const filtrando = termo !== "" || tipo !== "todos" || categoria !== "todas";
  const chave = `${termo}|${tipo}|${categoria}`;
  const limite = LIMITE_INICIAL + (expandido.chave === chave ? expandido.extra : 0);
  const mostradas = visiveis.slice(0, limite);

  // Depois da saída o veículo some da lista: o foco vai para o vizinho que ocupa o lugar e o leitor de tela é avisado.
  const { marcar, anuncio } = useFocoAposRemocao<number>({
    presentes: visiveis.map((item) => item.patioId),
    bloqueado: saida !== null,
    alvoDe: (id) => conteudo.current?.querySelector<HTMLElement>(`[data-patio-linha="${id}"] button`) ?? null,
    reserva: () => document.getElementById(BUSCA_ID),
  });

  function registrarSaida(veiculo: PatioVeiculo) {
    marcar({
      id: veiculo.patioId,
      vizinhos: vizinhosDe(
        visiveis.map((item) => item.patioId),
        veiculo.patioId,
      ),
      anuncio: `${veiculo.placa} saiu do pátio.`,
    });
    setSaida(veiculo);
  }

  function limparBusca() {
    setBusca("");
  }

  function limparFiltros() {
    setTipo("todos");
    setCategoria("todas");
  }

  // O modal de saída, o aviso e o anúncio precisam continuar na tela mesmo que a lista fique vazia (o último veículo saiu).
  // A chave mantém o modal montado quando a lista troca de estado (ex.: o último veículo saiu): sem ela, ele seria
  // recriado e perderia o recibo da saída.
  const extras = (
    <Fragment key="extras">
      <Anuncio role="status">{anuncio}</Anuncio>
      {saida && (
        <SaidaVeiculoModal
          buscaInicial={{ tipo: "placa", valor: saida.placa }}
          onClose={() => setSaida(null)}
          onSuccess={showToast}
        />
      )}
      {toast && <Toast message={toast.message} variant={toast.variant} onDismiss={dismissToast} />}
    </Fragment>
  );

  // Uma falha ao atualizar não derruba a lista que já está na tela.
  if (isError && data === undefined) {
    return (
      <Conteudo ref={conteudo}>
        <ListError error={error} what="o pátio" onRetry={() => void refetch()} retrying={isFetching} />
        {extras}
      </Conteudo>
    );
  }

  if (isPending) {
    return (
      <Conteudo ref={conteudo}>
        <div role="status" aria-label="Carregando o pátio">
          <EsqueletoLinha>
            <Skeleton width="260px" height="20px" />
            {Array.from({ length: ESQUELETO_LINHAS }, (_, indice) => (
              <Skeleton key={indice} height="56px" />
            ))}
          </EsqueletoLinha>
        </div>
        {extras}
      </Conteudo>
    );
  }

  if (todos.length === 0) {
    return (
      <Conteudo ref={conteudo}>
        <EmptyState>
          <Text variant="muted">Nenhum veículo no pátio.</Text>
          <Button type="button" onClick={abrirEntrada}>
            Registrar entrada
          </Button>
        </EmptyState>
        {extras}
      </Conteudo>
    );
  }

  return (
    <Conteudo ref={conteudo}>
      <Cabecalho>
        <Resumo>
          <span role="status">
            {filtrando ? (
              <>
                <strong>{resumo.mostrados}</strong> de {resumo.total} veículos
              </>
            ) : (
              <>
                <strong>{resumo.total}</strong> {resumo.total === 1 ? "veículo no pátio" : "veículos no pátio"}
              </>
            )}
          </span>
          {ocupacao && (
            <span title={`Carros ${ocupacao.carros.ocupadas} de ${ocupacao.carros.vagas} · Motos ${ocupacao.motos.ocupadas} de ${ocupacao.motos.vagas}`}>
              {`Ocupação ${ocupacao.percentual}%`}
            </span>
          )}
          <span>{`Permanência média ${formatarMinutos(estatisticas.mediaMinutos)}`}</span>
          {estatisticas.permanenciaLonga > 0 && <span>{`${estatisticas.permanenciaLonga} há 3 dias ou mais`}</span>}
          <span>{`Atualizado às ${formatTime(new Date(dataUpdatedAt).toISOString())}`}</span>
        </Resumo>
        <AtualizarBotao type="button" variant="secondary" size="sm" disabled={isFetching} onClick={() => void refetch()}>
          {isFetching ? "Atualizando…" : "Atualizar"}
        </AtualizarBotao>
      </Cabecalho>

      <PatioFiltros
        busca={busca}
        onBuscaChange={setBusca}
        tipo={tipo}
        onTipoChange={setTipo}
        categoria={categoria}
        onCategoriaChange={setCategoria}
        onLimparFiltros={limparFiltros}
        estatisticas={estatisticas}
      />

      {visiveis.length === 0 ? (
        <EmptyState>
          <Text variant="muted" role="status">
            {termo !== ""
              ? `Nada encontrado para “${termo}”.`
              : "Nenhum veículo com esses filtros."}
          </Text>
          {termo !== "" && (
            <Button type="button" variant="secondary" onClick={limparBusca}>
              Limpar busca
            </Button>
          )}
        </EmptyState>
      ) : (
        <>
          <PatioTabela veiculos={mostradas} onRegistrarSaida={registrarSaida} atualizando={isFetching} />
          {visiveis.length > mostradas.length && (
            <MaisBotao
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setExpandido({ chave, extra: (expandido.chave === chave ? expandido.extra : 0) + LIMITE_INICIAL })}
            >
              {`Mostrar mais ${Math.min(LIMITE_INICIAL, visiveis.length - mostradas.length)}`}
            </MaisBotao>
          )}
        </>
      )}

      <GraficosDetalhes>
        <summary>Ver gráficos do pátio</summary>
        <GraficosGrade>
          <BarrasHorizontais titulo="Tempo no pátio" itens={estatisticas.porPermanencia} />
          <BarrasHorizontais titulo="Por operador de entrada" itens={estatisticas.porOperador} />
          <ChegadasPorHora chegadas={chegadasPorHora(todos)} />
        </GraficosGrade>
      </GraficosDetalhes>
      {extras}
    </Conteudo>
  );
}
