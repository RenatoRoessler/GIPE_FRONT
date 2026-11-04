"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { formatTime } from "@/components/caixa/format";
import { ListError } from "@/components/mensalistas/ListError";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { TECLADO_PLACA } from "@/lib/teclado/tipos";
import type { VeiculoConveniada } from "@/types/patioConveniada";
import { Atualizacao, Busca, Conteudo, EsqueletoLinha, Grade, Indicadores, MaisBotao, Painel, Subtitulo, Titulo, Topo, VagaIcone, Vazio } from "../PatioConveniada.styles";
import { filtrarPorEstacionamento, filtrarPorPlaca, resumirPorEstacionamento } from "../patioConveniada";
import { ResumoConveniada } from "../ResumoConveniada";
import { usePatioConveniada } from "../usePatioConveniada";
import { usePatioConveniadaFiltros } from "../usePatioConveniadaFiltros";
import { VeiculoConveniadaCard } from "../VeiculoConveniadaCard";

const LIMITE_INICIAL = 100;
const ESQUELETO_CARDS = 6;
const PLACA_INVALIDA = "Placa inválida";

function Cabecalho() {
  return (
    <Topo>
      <Titulo>Pátio</Titulo>
      <Subtitulo>Veículos carimbados por você que ainda estão no estacionamento</Subtitulo>
    </Topo>
  );
}

// Esqueleto da lista no formato final; também serve de reserva do Suspense da página.
export function PatioConveniadaEsqueleto() {
  return (
    <Conteudo>
      <Cabecalho />
      <div role="status" aria-label="Carregando o pátio">
        <EsqueletoLinha>
          <Skeleton height="72px" radius="18px" />
          <Skeleton height="72px" radius="10px" />
          {Array.from({ length: ESQUELETO_CARDS }, (_, indice) => (
            <Skeleton key={indice} height="148px" radius="14px" />
          ))}
        </EsqueletoLinha>
      </div>
    </Conteudo>
  );
}

export function PatioConveniadaPage() {
  const router = useRouter();
  const filtros = usePatioConveniadaFiltros();
  const { busca, placaEnviada, placaInvalida, estacionamento } = filtros;

  // A lista inteira alimenta o resumo e os chips; a lista pedida (com a placa completa) é a que aparece.
  const inteira = usePatioConveniada("");
  const lista = usePatioConveniada(placaEnviada);
  const { data, isPending, isError, error, refetch, isFetching, dataUpdatedAt } = lista;

  // Placa completa e inválida: o campo avisa e a lista fica como estava, com o último filtro que valia.
  const [buscaValida, setBuscaValida] = useState(placaInvalida ? "" : busca);
  if (!placaInvalida && buscaValida !== busca) {
    setBuscaValida(busca);
  }

  // Quantas linhas a mais foram pedidas para esta combinação de filtros: ao mudar a combinação, volta a 100.
  const [expandido, setExpandido] = useState({ chave: "", extra: 0 });

  const todos = useMemo(() => inteira.data ?? data ?? [], [inteira.data, data]);
  const resumo = useMemo(() => resumirPorEstacionamento(todos), [todos]);
  // Um estacionamento que saiu da lista (todos os veículos dele deram baixa) deixa de filtrar, para a tela não esvaziar sem motivo.
  const empresaAtiva = resumo.porEstacionamento.some((item) => item.empresaId === estacionamento) ? estacionamento : null;

  const visiveis = useMemo(
    () => filtrarPorEstacionamento(filtrarPorPlaca(data ?? [], buscaValida), empresaAtiva),
    [data, buscaValida, empresaAtiva],
  );
  const filtrando = buscaValida.trim() !== "" || empresaAtiva !== null;
  const combinacao = `${buscaValida}|${empresaAtiva}`;
  const limite = LIMITE_INICIAL + (expandido.chave === combinacao ? expandido.extra : 0);
  const mostradas: VeiculoConveniada[] = visiveis.slice(0, limite);

  const cabecalho = <Cabecalho />;

  // Uma falha ao atualizar não derruba a lista que já está na tela.
  if (isError && data === undefined) {
    return (
      <Conteudo>
        {cabecalho}
        <ListError error={error} what="o pátio" onRetry={() => void refetch()} retrying={isFetching} />
      </Conteudo>
    );
  }

  if (isPending) {
    return <PatioConveniadaEsqueleto />;
  }

  const vazio = todos.length === 0 && !filtrando;
  const contagem = filtrando
    ? `${visiveis.length} de ${todos.length} ${todos.length === 1 ? "veículo" : "veículos"}`
    : `${todos.length} ${todos.length === 1 ? "veículo no pátio" : "veículos no pátio"}`;

  return (
    <Conteudo>
      {cabecalho}

      {!vazio && (
        <Painel>
          <ResumoConveniada resumo={resumo} estacionamento={empresaAtiva} onEstacionamentoChange={filtros.setEstacionamento} />
          <Busca>
            <Input
              label="Placa"
              type="search"
              value={busca}
              onChange={(event) => filtros.setBusca(event.target.value)}
              error={placaInvalida ? PLACA_INVALIDA : undefined}
              placeholder="ABC1D23"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              teclado={TECLADO_PLACA}
            />
          </Busca>
        </Painel>
      )}

      {!vazio && (
        <Atualizacao>
          <Indicadores>
            <span role="status">{contagem}</span>
            <span>{`Atualizado às ${formatTime(new Date(dataUpdatedAt).toISOString())}`}</span>
          </Indicadores>
          <Button type="button" variant="secondary" size="sm" disabled={isFetching} onClick={() => void refetch()}>
            {isFetching ? "Atualizando…" : "Atualizar"}
          </Button>
        </Atualizacao>
      )}

      {isError && data !== undefined && !vazio && (
        <ListError error={error} what="o pátio" onRetry={() => void refetch()} retrying={isFetching} />
      )}

      {vazio ? (
        <Vazio>
          <VagaIcone aria-hidden="true" />
          <b>Nenhum veículo carimbado em aberto</b>
          <p>Os tickets que você carimbar aparecem aqui até o veículo sair.</p>
          <Button type="button" onClick={() => router.push("/carimbo")}>
            Carimbar ticket
          </Button>
        </Vazio>
      ) : visiveis.length === 0 ? (
        <Vazio>
          <VagaIcone aria-hidden="true" />
          <b role="status">{buscaValida.trim() !== "" ? "Nenhum carro encontrado" : "Nenhum veículo neste estacionamento"}</b>
          <p>
            {buscaValida.trim() !== ""
              ? `Nada encontrado para “${buscaValida.trim().toUpperCase()}”. Confira a placa.`
              : "Escolha outro estacionamento para ver os demais veículos."}
          </p>
          {buscaValida.trim() !== "" && (
            <Button type="button" variant="secondary" onClick={filtros.limparBusca}>
              Limpar busca
            </Button>
          )}
          {empresaAtiva !== null && (
            <Button type="button" variant="secondary" onClick={() => filtros.setEstacionamento(null)}>
              Mostrar todos os estacionamentos
            </Button>
          )}
        </Vazio>
      ) : (
        <>
          <Grade $atualizando={isFetching} aria-label="Veículos carimbados no pátio" aria-busy={isFetching}>
            {mostradas.map((veiculo) => (
              <li key={veiculo.patioConvenioId}>
                <VeiculoConveniadaCard veiculo={veiculo} />
              </li>
            ))}
          </Grade>
          {visiveis.length > mostradas.length && (
            <MaisBotao>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setExpandido({ chave: combinacao, extra: (expandido.chave === combinacao ? expandido.extra : 0) + LIMITE_INICIAL })}
              >
                {`Mostrar mais ${Math.min(LIMITE_INICIAL, visiveis.length - mostradas.length)}`}
              </Button>
            </MaisBotao>
          )}
        </>
      )}
    </Conteudo>
  );
}
