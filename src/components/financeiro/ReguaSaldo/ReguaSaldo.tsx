"use client";

import { KeyboardEvent, useEffect, useId, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatBRL } from "@/lib/money";
import { AGRUPAMENTO_FLUXO, type AgrupamentoFluxo, type FluxoPeriodo } from "@/types/financeiro";
import { formatDiaMes, formatSaldo, rotuloDiaCompleto, rotuloMesExtenso } from "../format";
import {
  LIMITE_PERIODO_LONGO,
  PONTOS_SEM_ROLAGEM,
  abreviar,
  alturaHaste,
  escala,
  maiorEntrada,
  marcasEixoX,
  marcasEixoY,
  pontosAcumulado,
  pontosParaSvg,
  posicaoY,
  temMovimento,
} from "../regua";
import {
  Amostra,
  Anuncio,
  Area,
  Aviso,
  Balao,
  Coluna,
  Colunas,
  EixoX,
  EixoY,
  Haste,
  Legenda,
  Linha,
  LinhaZero,
  MarcaX,
  MarcaY,
  Plano,
  Ponto,
  Quadro,
  Raiz,
  Rolagem,
  SemMovimento,
  Titulo,
} from "./ReguaSaldo.styles";

export interface ReguaSaldoProps {
  periodos: FluxoPeriodo[];
  agrupamento: AgrupamentoFluxo;
  // "Período longo: ver por mês".
  onVerPorMes: () => void;
}

const TITULO = "Evolução do saldo";

// "Qui, 22/10/2026" por dia; "Outubro de 2026" por mês.
function rotuloDoPonto(periodo: FluxoPeriodo, agrupamento: AgrupamentoFluxo): string {
  return agrupamento === AGRUPAMENTO_FLUXO.Mes ? rotuloMesExtenso(periodo.data) : rotuloDiaCompleto(periodo.data);
}

function descreverPonto(periodo: FluxoPeriodo, agrupamento: AgrupamentoFluxo): string {
  const rotulo = rotuloDoPonto(periodo, agrupamento);
  if (periodo.entradas === 0 && periodo.saidas === 0) {
    return `${rotulo}. Sem movimento. Saldo acumulado ${formatSaldo(periodo.saldoAcumulado)}.`;
  }
  return `${rotulo}. Entradas ${formatBRL(periodo.entradas)}, saídas ${formatBRL(periodo.saidas)}, saldo ${formatSaldo(periodo.saldo)}, saldo acumulado ${formatSaldo(periodo.saldoAcumulado)}.`;
}

function resumir(periodos: FluxoPeriodo[]): string {
  const primeiro = periodos[0];
  const ultimo = periodos[periodos.length - 1];
  const maior = maiorEntrada(periodos);
  const evolucao = `Saldo acumulado de ${formatSaldo(primeiro.saldoAcumulado)} a ${formatSaldo(ultimo.saldoAcumulado)}.`;
  return maior ? `${evolucao} Maior entrada em ${formatDiaMes(maior.data)}: ${formatBRL(maior.entradas)}.` : evolucao;
}

// Entradas e saídas de cada dia (ou mês) e o saldo acumulado por cima. Feita à mão, como o gráfico do Caixa: as
// colunas são CSS e a linha é um SVG simples. O mesmo conteúdo, com todos os valores, está na tabela logo abaixo.
export function ReguaSaldo({ periodos, agrupamento, onVerPorMes }: ReguaSaldoProps) {
  const clipId = `${useId().replace(/:/g, "")}-negativo`;
  const quadroRef = useRef<HTMLDivElement>(null);
  const rolagemRef = useRef<HTMLDivElement>(null);
  const [ativo, setAtivo] = useState<number | null>(null);

  const referencia = useMemo(() => escala(periodos), [periodos]);
  const pontos = useMemo(() => pontosAcumulado(periodos, referencia), [periodos, referencia]);
  const marcasX = useMemo(() => marcasEixoX(periodos, agrupamento), [periodos, agrupamento]);
  const marcasY = useMemo(() => marcasEixoY(referencia), [referencia]);

  // No celular, com muitos pontos, a régua rola na horizontal e começa pelos mais recentes.
  useEffect(() => {
    if (rolagemRef.current && periodos.length > PONTOS_SEM_ROLAGEM) {
      rolagemRef.current.scrollLeft = rolagemRef.current.scrollWidth;
    }
  }, [periodos]);

  if (!temMovimento(periodos)) {
    return (
      <Raiz aria-label={TITULO}>
        <Titulo>{TITULO}</Titulo>
        <SemMovimento>Nenhuma entrada ou saída neste período.</SemMovimento>
      </Raiz>
    );
  }

  const total = periodos.length;
  const indice = ativo !== null && ativo < total ? ativo : null;
  const periodoAtivo = indice !== null ? periodos[indice] : null;
  const zero = posicaoY(0, referencia);
  const temNegativo = periodos.some((periodo) => periodo.saldoAcumulado < 0);
  const longo = agrupamento === AGRUPAMENTO_FLUXO.Dia && total > LIMITE_PERIODO_LONGO;
  const unidade = agrupamento === AGRUPAMENTO_FLUXO.Mes ? "meses" : "dias";

  function ir(proximo: number) {
    setAtivo(proximo);
    const colunas = quadroRef.current?.querySelectorAll("[data-coluna]");
    colunas?.[proximo]?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  }

  function aoTeclar(event: KeyboardEvent<HTMLDivElement>) {
    switch (event.key) {
      case "ArrowRight":
        event.preventDefault();
        ir(indice === null ? 0 : Math.min(indice + 1, total - 1));
        break;
      case "ArrowLeft":
        event.preventDefault();
        ir(indice === null ? total - 1 : Math.max(indice - 1, 0));
        break;
      case "Home":
        event.preventDefault();
        ir(0);
        break;
      case "End":
        event.preventDefault();
        ir(total - 1);
        break;
      case "Escape":
        setAtivo(null);
        break;
    }
  }

  return (
    <Raiz aria-label={TITULO}>
      <Titulo>{TITULO}</Titulo>
      <Legenda aria-hidden="true">
        <span>
          <Amostra $tom="success" />
          Entradas
        </span>
        <span>
          <Amostra $tom="danger" />
          Saídas
        </span>
        <span>
          <Amostra $tom="accent" />
          Saldo acumulado
        </span>
      </Legenda>
      {longo && (
        <Aviso>
          Período longo: as colunas ficam finas.
          <Button type="button" size="sm" variant="secondary" onClick={onVerPorMes}>
            Ver por mês
          </Button>
        </Aviso>
      )}
      <Quadro
        ref={quadroRef}
        tabIndex={0}
        role="group"
        aria-roledescription="gráfico"
        aria-label={`${TITULO}. ${resumir(periodos)} Use as setas para ver os ${unidade}.`}
        onKeyDown={aoTeclar}
        onMouseLeave={() => setAtivo(null)}
      >
        <EixoY aria-hidden="true">
          {marcasY.map((marca) => (
            <MarcaY key={marca.valor} $posicao={marca.posicao}>
              {abreviar(marca.valor)}
            </MarcaY>
          ))}
        </EixoY>
        <Rolagem ref={rolagemRef}>
          <Area $pontos={total}>
            <Plano aria-hidden="true">
              <LinhaZero $posicao={zero} />
              <Colunas>
                {periodos.map((periodo, posicao) => (
                  <Coluna key={periodo.data} data-coluna $ativa={posicao === indice} onMouseEnter={() => setAtivo(posicao)} onClick={() => setAtivo(posicao)}>
                    <Haste $sentido="entrada" $zero={zero} $altura={alturaHaste(periodo.entradas, referencia)} />
                    <Haste $sentido="saida" $zero={zero} $altura={alturaHaste(periodo.saidas, referencia)} />
                  </Coluna>
                ))}
              </Colunas>
              <Linha viewBox="0 0 100 100" preserveAspectRatio="none">
                {temNegativo && (
                  <>
                    <clipPath id={clipId}>
                      <rect x="0" y={zero} width="100" height={100 - zero} />
                    </clipPath>
                    <polygon
                      clipPath={`url(#${clipId})`}
                      points={`${pontosParaSvg(pontos)} ${pontos[pontos.length - 1].x},${zero} ${pontos[0].x},${zero}`}
                    />
                  </>
                )}
                <polyline points={pontosParaSvg(pontos)} />
              </Linha>
              {indice !== null && periodoAtivo && (
                <>
                  <Ponto $x={pontos[indice].x} $y={pontos[indice].y} />
                  <Balao $x={pontos[indice].x}>
                    <strong>{rotuloDoPonto(periodoAtivo, agrupamento)}</strong>
                    {periodoAtivo.entradas === 0 && periodoAtivo.saidas === 0 ? (
                      <span>Sem movimento</span>
                    ) : null}
                    <dl>
                      {(periodoAtivo.entradas !== 0 || periodoAtivo.saidas !== 0) && (
                        <>
                          <dt>Entradas</dt>
                          <dd>{formatBRL(periodoAtivo.entradas)}</dd>
                          <dt>Saídas</dt>
                          <dd>{formatBRL(periodoAtivo.saidas)}</dd>
                          <dt>Saldo</dt>
                          <dd>{formatSaldo(periodoAtivo.saldo)}</dd>
                        </>
                      )}
                      <dt>Acumulado</dt>
                      <dd>{formatSaldo(periodoAtivo.saldoAcumulado)}</dd>
                    </dl>
                  </Balao>
                </>
              )}
            </Plano>
            <EixoX aria-hidden="true">
              {marcasX.map((marca) => (
                <MarcaX key={marca.indice} $x={((marca.indice + 0.5) / total) * 100} $borda={marca.indice === 0 ? "inicio" : marca.indice === total - 1 ? "fim" : undefined}>
                  {marca.rotulo}
                </MarcaX>
              ))}
            </EixoX>
          </Area>
        </Rolagem>
        <Anuncio aria-live="polite">{periodoAtivo ? descreverPonto(periodoAtivo, agrupamento) : ""}</Anuncio>
      </Quadro>
    </Raiz>
  );
}
