"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useTheme } from "styled-components";
import type { Dashboard } from "@/types/dashboard";
import { ORIGENS, corDoTema, graficoDiario, type ColunaDiaria } from "../apresentacao";
import { brl, brlCompacto, dataCurta, diaSemanaCurto } from "../format";
import { PainelDashboard } from "../PainelDashboard";
import { TextoOculto } from "../shared.styles";
import {
  Area,
  Barra,
  Coluna,
  Detalhe,
  DetalheTitulo,
  Eixo,
  ItemLegenda,
  Lacuna,
  Legenda,
  Marcador,
  Segmento,
  Vazio,
} from "./GraficoFaturamentoDiario.styles";

export interface GraficoFaturamentoDiarioProps {
  dashboard: Dashboard;
  hoje: Date;
}

const DICA = "Passe o mouse, toque ou use as setas para ver cada dia.";

function rotuloDoDia(coluna: ColunaDiaria, hoje: Date): string {
  return `${diaSemanaCurto(coluna.data)}, ${dataCurta(coluna.data, hoje)}`;
}

// Faturamento por dia, em colunas empilhadas por origem. O recorte (os dias do mês fechado ou os 30 dias até o fim do período)
// vem da API. As colunas são botões com um só ponto de tabulação: ← e → andam entre os dias com uso, Home e End vão às pontas e
// Esc limpa a seleção. O detalhe do dia aparece acima do gráfico, com a altura reservada.
export function GraficoFaturamentoDiario({ dashboard, hoje }: GraficoFaturamentoDiarioProps) {
  const theme = useTheme();
  const resumoId = useId();
  const grafico = useMemo(() => graficoDiario(dashboard, hoje), [dashboard, hoje]);
  const { colunas } = grafico;
  const botoes = useRef<(HTMLButtonElement | null)[]>([]);
  const area = useRef<HTMLDivElement>(null);

  // A seleção vale para este conjunto de colunas: quando chega outra resposta (outro período), ela some sozinha.
  const [escolha, setEscolha] = useState<{ colunas: ColunaDiaria[]; indice: number } | null>(null);
  const selecionado = escolha !== null && escolha.colunas === colunas ? escolha.indice : null;
  const escolher = (indice: number | null) => setEscolha(indice === null ? null : { colunas, indice });

  // Tocar fora do gráfico fecha o detalhe (no celular não há "mouse saindo").
  useEffect(() => {
    if (selecionado === null) return;
    function aoTocarFora(evento: PointerEvent) {
      if (!area.current?.contains(evento.target as Node)) setEscolha(null);
    }
    document.addEventListener("pointerdown", aoTocarFora);
    return () => document.removeEventListener("pointerdown", aoTocarFora);
  }, [selecionado]);

  const comUso = colunas.flatMap((coluna, indice) => (coluna.valores ? [indice] : []));
  const tabulavel = selecionado ?? comUso[comUso.length - 1];

  function irPara(indice: number | undefined) {
    if (indice === undefined) return;
    escolher(indice);
    botoes.current[indice]?.focus();
  }

  function aoTeclar(evento: KeyboardEvent<HTMLButtonElement>, indice: number) {
    const posicao = comUso.indexOf(indice);
    switch (evento.key) {
      case "ArrowRight":
        evento.preventDefault();
        irPara(comUso[Math.min(posicao + 1, comUso.length - 1)]);
        break;
      case "ArrowLeft":
        evento.preventDefault();
        irPara(comUso[Math.max(posicao - 1, 0)]);
        break;
      case "Home":
        evento.preventDefault();
        irPara(comUso[0]);
        break;
      case "End":
        evento.preventDefault();
        irPara(comUso[comUso.length - 1]);
        break;
      case "Escape":
        escolher(null);
        break;
    }
  }

  const legenda =
    grafico.legenda.length === 0 ? undefined : (
      <Legenda aria-label="Origens do faturamento">
        {grafico.legenda.map((item) => (
          <ItemLegenda key={item.chave}>
            <Marcador $cor={corDoTema(theme.colors, item.cor)} aria-hidden="true" />
            {item.nome}
          </ItemLegenda>
        ))}
      </Legenda>
    );

  if (grafico.vazio) {
    return (
      <PainelDashboard titulo={grafico.titulo}>
        <Vazio>O gráfico começa a aparecer a partir do primeiro dia com saídas registradas.</Vazio>
      </PainelDashboard>
    );
  }

  const atual = selecionado === null ? null : colunas[selecionado];

  return (
    <PainelDashboard titulo={grafico.titulo} acessorio={legenda}>
      <Detalhe>
        {atual === null ? (
          <span>{DICA}</span>
        ) : (
          <>
            <DetalheTitulo>
              {rotuloDoDia(atual, hoje)} · {brl(atual.total, { centavos: true })}
            </DetalheTitulo>
            <span>
              {atual.total === 0
                ? "Sem faturamento neste dia"
                : ORIGENS.filter((origem) => (atual.valores?.[origem.chave] ?? 0) > 0)
                    .map((origem) => `${origem.nome} ${brlCompacto(atual.valores![origem.chave])}`)
                    .join(" · ")}
            </span>
          </>
        )}
      </Detalhe>
      <TextoOculto id={resumoId}>{grafico.resumo}</TextoOculto>
      <Area
        ref={area}
        role="group"
        aria-label="Faturamento por dia"
        aria-describedby={resumoId}
        onBlur={(evento) => {
          // O foco saindo do gráfico (Tab, por exemplo) limpa a seleção.
          if (!evento.currentTarget.contains(evento.relatedTarget)) escolher(null);
        }}
        onPointerLeave={(evento) => {
          // O mouse saindo limpa a seleção, a menos que o teclado esteja nela.
          if (evento.pointerType === "mouse" && !evento.currentTarget.contains(document.activeElement)) escolher(null);
        }}
      >
        {colunas.map((coluna, indice) => {
          if (!coluna.valores) {
            return <Lacuna key={coluna.data.getTime()} data-lacuna="" title={`${rotuloDoDia(coluna, hoje)} · antes do início do uso`} />;
          }
          const altura = grafico.maximo > 0 ? (coluna.total / grafico.maximo) * 100 : 0;
          return (
            <Coluna
              key={coluna.data.getTime()}
              ref={(no) => {
                botoes.current[indice] = no;
              }}
              type="button"
              $destaque={coluna.destaque}
              $ativa={selecionado === indice}
              tabIndex={indice === tabulavel ? 0 : -1}
              aria-label={`${rotuloDoDia(coluna, hoje)}: ${brl(coluna.total, { centavos: true })}`}
              aria-pressed={selecionado === indice}
              onClick={() => escolher(indice)}
              onFocus={() => escolher(indice)}
              onPointerEnter={(evento) => {
                if (evento.pointerType === "mouse") escolher(indice);
              }}
              onKeyDown={(evento) => aoTeclar(evento, indice)}
            >
              <Barra $altura={altura} $destaque={coluna.destaque} $semValor={coluna.total === 0}>
                {ORIGENS.map((origem) =>
                  coluna.valores![origem.chave] > 0 ? <Segmento key={origem.chave} $valor={coluna.valores![origem.chave]} $cor={corDoTema(theme.colors, origem.cor)} /> : null,
                )}
              </Barra>
            </Coluna>
          );
        })}
      </Area>
      <Eixo aria-hidden="true">
        <span>{grafico.eixo[0]}</span>
        <span>{grafico.eixo[1]}</span>
        <span>{grafico.eixo[2]}</span>
      </Eixo>
    </PainelDashboard>
  );
}
