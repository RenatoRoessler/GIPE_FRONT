"use client";

import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useTheme } from "styled-components";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type { DashboardMovimentoPorHora, DashboardPeriodo } from "@/types/dashboard";
import { agruparHoras, detalheDoGrupo, grupoNaFaixa, horaInicialDoGrafico, textoFaixa, tituloPorHora, type GrupoHora } from "../apresentacao";
import { PainelDashboard } from "../PainelDashboard";
import { PERIODO_DASHBOARD } from "@/types/dashboard";
import {
  Area,
  Barra,
  Coluna,
  Detalhe,
  DetalheTitulo,
  Eixo,
  Faixa,
  FaixaHoras,
  FaixaMedia,
  FaixaNumeros,
  Faixas,
  Futura,
  Valor,
  Vazio,
} from "./MovimentoPorHora.styles";

export interface MovimentoPorHoraProps {
  // Nulo quando não se aplica: empresa nova ou, em semana e mês, menos de 7 dias de uso.
  movimento: DashboardMovimentoPorHora | null;
  periodo: DashboardPeriodo;
  // Nulo = empresa nova (nenhuma saída ainda).
  inicioUso: string | null;
  // Vagas do pátio, para dizer a % das vagas. Zero (período fechado não traz o pátio) esconde a %.
  capacidade: number;
  // O instante de agora: abre o gráfico de hoje na hora atual.
  agora: Date;
}

const ALTURA_MINIMA = 3;
const ALTURA_MAXIMA = 82;
const HORAS_NO_EIXO = ["0h", "6h", "12h", "18h", "23h"];

function veiculos(valor: number): string {
  const inteiro = Math.round(valor);
  return `${inteiro} ${inteiro === 1 ? "veículo" : "veículos"}`;
}

// Veículos no pátio em cada hora (no Dia) ou em média (Semana e Mês), com o detalhe da hora escolhida e as faixas de maior e
// menor movimento. As horas vêm de 1 em 1; em tela estreita, ou quando os números têm 3 dígitos e a tela é média, são agrupadas de
// 2 em 2, porque 24 rótulos não cabem. Sempre há uma hora selecionada; as colunas são botões com um só ponto de tabulação.
export function MovimentoPorHora({ movimento, periodo, inicioUso, capacidade, agora }: MovimentoPorHoraProps) {
  const theme = useTheme();
  const titulo = tituloPorHora(periodo, agora);
  const estreita = useMediaQuery(`(max-width: ${parseInt(theme.breakpoints.sm, 10) - 1}px)`);
  const media = useMediaQuery(`(max-width: ${parseInt(theme.breakpoints.lg, 10) - 1}px)`);

  const maior = movimento ? Math.max(0, ...movimento.horas.map((hora) => hora?.veiculos ?? 0)) : 0;
  const passo = estreita || (media && maior >= 100) ? 2 : 1;
  const grupos = useMemo(() => (movimento ? agruparHoras(movimento.horas, passo) : []), [movimento, passo]);

  // Só o dia em andamento abre na hora atual; os demais, no maior movimento.
  const horaAtual = periodo.tipo === PERIODO_DASHBOARD.Dia && !periodo.fechado ? agora.getHours() : null;
  const inicial = movimento ? horaInicialDoGrafico(grupos, movimento.maiorMovimento, horaAtual) : null;

  // A escolha vale para este conjunto de grupos: com outra resposta ou outro agrupamento volta à hora inicial.
  const [escolha, setEscolha] = useState<{ grupos: GrupoHora[]; hora: number } | null>(null);
  const selecionada = escolha !== null && escolha.grupos === grupos ? escolha.hora : inicial;
  const botoes = useRef<Record<number, HTMLButtonElement | null>>({});

  if (movimento === null) {
    const mensagem =
      inicioUso === null || periodo.tipo === PERIODO_DASHBOARD.Dia
        ? "Aparece a partir do primeiro dia com veículos no pátio."
        : "As médias por hora aparecem depois de 7 dias de uso. No seletor Dia você já vê cada dia.";
    return (
      <PainelDashboard titulo={titulo}>
        <Vazio>{mensagem}</Vazio>
      </PainelDashboard>
    );
  }

  const comDado = grupos.filter((grupo) => !grupo.vazio);
  const maiorDoGrafico = Math.max(1, ...grupos.map((grupo) => grupo.veiculos));
  const grupo = grupos.find((item) => item.hora === selecionada && !item.vazio) ?? null;

  function escolher(hora: number) {
    setEscolha({ grupos, hora });
    botoes.current[hora]?.focus();
  }

  function aoTeclar(evento: KeyboardEvent<HTMLButtonElement>, hora: number) {
    const posicao = comDado.findIndex((item) => item.hora === hora);
    const vai = (indice: number) => {
      evento.preventDefault();
      const alvo = comDado[Math.min(Math.max(indice, 0), comDado.length - 1)];
      if (alvo) escolher(alvo.hora);
    };
    if (evento.key === "ArrowRight") vai(posicao + 1);
    else if (evento.key === "ArrowLeft") vai(posicao - 1);
    else if (evento.key === "Home") vai(0);
    else if (evento.key === "End") vai(comDado.length - 1);
  }

  const detalhe = grupo ? detalheDoGrupo(grupo, { media: movimento.media, capacidade }) : null;

  return (
    <PainelDashboard titulo={titulo}>
      <Area role="group" aria-label="Veículos no pátio por hora">
        {grupos.map((item) => {
          if (item.vazio) return <Futura key={item.hora} data-futura="" title={`${item.hora}h · ainda não chegou`} />;
          const ativa = item.hora === selecionada;
          return (
            <Coluna
              key={item.hora}
              ref={(no) => {
                botoes.current[item.hora] = no;
              }}
              type="button"
              tabIndex={ativa ? 0 : -1}
              aria-pressed={ativa}
              aria-label={`${item.hora}h a ${item.horaFim}h: ${veiculos(item.veiculos)}`}
              onClick={() => setEscolha({ grupos, hora: item.hora })}
              onKeyDown={(evento) => aoTeclar(evento, item.hora)}
            >
              <Valor $ativa={ativa}>{item.veiculos}</Valor>
              <Barra
                $altura={Math.max((item.veiculos / maiorDoGrafico) * ALTURA_MAXIMA, ALTURA_MINIMA)}
                $pico={grupoNaFaixa(item, movimento.maiorMovimento)}
                $ativa={ativa}
              />
            </Coluna>
          );
        })}
      </Area>
      <Eixo aria-hidden="true">
        {HORAS_NO_EIXO.map((hora) => (
          <span key={hora}>{hora}</span>
        ))}
      </Eixo>
      {detalhe && (
        <Detalhe>
          <DetalheTitulo>{detalhe.titulo}</DetalheTitulo>
          <span>{detalhe.veiculos}</span>
          <span>{detalhe.entradas}</span>
        </Detalhe>
      )}
      <Faixas>
        {movimento.maiorMovimento && (
          <Faixa>
            <span>Maior movimento</span>
            <FaixaNumeros>
              <FaixaHoras>{textoFaixa(movimento.maiorMovimento)}</FaixaHoras>
              <FaixaMedia>{veiculos(movimento.maiorMovimento.veiculosMedia)}</FaixaMedia>
            </FaixaNumeros>
          </Faixa>
        )}
        {movimento.menorMovimento && (
          <Faixa>
            <span>Menor movimento</span>
            <FaixaNumeros>
              <FaixaHoras>{textoFaixa(movimento.menorMovimento)}</FaixaHoras>
              <FaixaMedia>{veiculos(movimento.menorMovimento.veiculosMedia)}</FaixaMedia>
            </FaixaNumeros>
          </Faixa>
        )}
      </Faixas>
    </PainelDashboard>
  );
}
