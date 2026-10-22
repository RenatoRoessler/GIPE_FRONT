"use client";

import { chegadasPorHora, estatisticasPatio, formatarMinutos, ocupacaoPatio } from "@/components/patio/patio";
import { usePatio } from "@/components/patio/usePatio";
import { useVagasPatio } from "@/components/patio/useVagasPatio";
import { BarrasHorizontais, ChegadasPorHora, RoscaMensalistas } from "@/components/patio/graficos";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Text } from "@/components/ui/Text";
import { ApiError } from "@/lib/api/errors";
import { Detalhe, Graficos, Indicador, Indicadores, Mensagem, PatioLink, Secao, SecaoCabecalho } from "./IndicadoresPatio.styles";

// Quem não tem acesso ao pátio não vê a seção em vez de ver um erro numa tela que não é a dele.
export function IndicadoresPatio() {
  const { data, isPending, isError, error, refetch, isFetching } = usePatio();
  const vagas = useVagasPatio();

  if (isError && data === undefined) {
    if (error instanceof ApiError && error.kind === "forbidden") {
      return null;
    }
    return (
      <Secao aria-label="Indicadores do pátio">
        <Mensagem>
          <Text variant="error" role="alert">
            Não foi possível carregar os indicadores do pátio.
          </Text>
          <Button type="button" variant="secondary" size="sm" onClick={() => void refetch()} disabled={isFetching}>
            Tentar novamente
          </Button>
        </Mensagem>
      </Secao>
    );
  }

  if (isPending) {
    return (
      <Secao aria-label="Indicadores do pátio">
        <div role="status" aria-label="Carregando os indicadores do pátio">
          <Skeleton height="96px" />
        </div>
      </Secao>
    );
  }

  const stats = estatisticasPatio(data ?? []);
  const ocupacao = vagas ? ocupacaoPatio(data ?? [], vagas) : null;

  return (
    <Secao aria-labelledby="indicadores-patio-titulo">
      <SecaoCabecalho>
        <Text as="h2" variant="heading" id="indicadores-patio-titulo">
          Pátio agora
        </Text>
        <PatioLink href="/patio">Ver o pátio</PatioLink>
      </SecaoCabecalho>

      <Indicadores>
        {ocupacao && (
          <Indicador $alerta={ocupacao.percentual >= 90}>
            <dt>
              das vagas ocupadas
              <Detalhe>{`Carros ${ocupacao.carros.ocupadas} de ${ocupacao.carros.vagas} · Motos ${ocupacao.motos.ocupadas} de ${ocupacao.motos.vagas}`}</Detalhe>
            </dt>
            <dd>{ocupacao.percentual}%</dd>
          </Indicador>
        )}
        <Indicador>
          <dt>{stats.total === 1 ? "veículo no pátio" : "veículos no pátio"}</dt>
          <dd>{stats.total}</dd>
        </Indicador>
        <Indicador>
          <dt>
            de mensalistas
            <Detalhe>{`${stats.mensalistas} de ${stats.total}`}</Detalhe>
          </dt>
          <dd>{stats.percentualMensalistas}%</dd>
        </Indicador>
        <Indicador>
          <dt>permanência média</dt>
          <dd>{stats.total === 0 ? "—" : formatarMinutos(stats.mediaMinutos)}</dd>
        </Indicador>
        <Indicador $alerta={stats.permanenciaLonga > 0}>
          <dt>
            há 3 dias ou mais
            {stats.maisAntigo && <Detalhe>{`Mais antigo: ${stats.maisAntigo.placa}, ${stats.maisAntigo.permanencia}`}</Detalhe>}
          </dt>
          <dd>{stats.permanenciaLonga}</dd>
        </Indicador>
      </Indicadores>

      {stats.total > 0 && (
        <Graficos>
          <RoscaMensalistas mensalistas={stats.mensalistas} avulsos={stats.avulsos} percentual={stats.percentualMensalistas} />
          <BarrasHorizontais titulo="Por categoria" itens={stats.porCategoria} />
          <BarrasHorizontais titulo="Tempo no pátio" itens={stats.porPermanencia} />
          <BarrasHorizontais titulo="Por operador de entrada" itens={stats.porOperador} />
          <ChegadasPorHora chegadas={chegadasPorHora(data ?? [])} />
        </Graficos>
      )}
    </Secao>
  );
}
