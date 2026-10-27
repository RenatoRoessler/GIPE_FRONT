"use client";

import { KeyboardEvent, useRef, useState } from "react";
import type { EstadoGancho } from "@/types/quadroChaves";
import { Cell, ColumnHeader, Gancho, GanchoEstatico, Grid, Legenda, Row, RowHeader, Scroller } from "./KeyBoardGrid.styles";

export interface KeyBoardGanchoItem {
  id: string | number;
  coluna: number;
  estado: EstadoGancho;
  // Nome do gancho (ex.: "A2").
  rotulo: string;
  // Texto pequeno sob o rótulo; sem ele, o modo "escolher" usa "livre", "aqui" ou "ocupado".
  legenda?: string;
  // Posição que já existe e não pode ser alterada (acrescentar posições): aparece como ocupada e sem toque.
  bloqueado?: boolean;
}

export interface KeyBoardLinha {
  rotulo: string;
  ganchos: KeyBoardGanchoItem[];
}

export interface KeyBoardGridProps {
  linhas: KeyBoardLinha[];
  // `configurar` alterna livre e fora de uso; `escolher` seleciona só ganchos livres.
  modo: "configurar" | "escolher";
  onToggle?: (id: string | number) => void;
  onSelect?: (id: string | number) => void;
  "aria-label": string;
}

type Celula = { chave: string; item: KeyBoardGanchoItem; focavel: boolean };

function legendaPadrao(item: KeyBoardGanchoItem, modo: KeyBoardGridProps["modo"]): string | undefined {
  if (item.legenda !== undefined) return item.legenda;
  if (modo === "configurar") return undefined;
  if (item.estado === "livre") return "livre";
  if (item.estado === "selecionado") return "aqui";
  if (item.estado === "ocupado") return "ocupado";
  return undefined;
}

function nomeAcessivel(item: KeyBoardGanchoItem, modo: KeyBoardGridProps["modo"]): string {
  if (item.bloqueado) return `${item.rotulo}, já cadastrado`;
  switch (item.estado) {
    case "livre":
      return `${item.rotulo}, ${modo === "configurar" ? "em uso" : "livre"}`;
    case "selecionado":
      return `${item.rotulo}, selecionado`;
    case "ocupado":
      return item.legenda ? `${item.rotulo}, ocupado, ${item.legenda}` : `${item.rotulo}, ocupado`;
    case "fora":
      return `${item.rotulo}, fora de uso`;
  }
}

// Espelho do quadro físico: linhas e colunas numa grade. Colunas que faltam numa linha aparecem como fora de uso.
export function KeyBoardGrid({ linhas, modo, onToggle, onSelect, "aria-label": ariaLabel }: KeyBoardGridProps) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [ativo, setAtivo] = useState<string | null>(null);

  const totalColunas = linhas.reduce((max, linha) => linha.ganchos.reduce((m, g) => Math.max(m, g.coluna), max), 0);

  const matriz: Celula[][] = linhas.map((linha, r) =>
    Array.from({ length: totalColunas }, (_, c) => {
      const coluna = c + 1;
      const item: KeyBoardGanchoItem = linha.ganchos.find((g) => g.coluna === coluna) ?? {
        id: `${linha.rotulo}${coluna}`,
        coluna,
        estado: "fora",
        rotulo: `${linha.rotulo}${coluna}`,
      };
      const focavel =
        !item.bloqueado &&
        (modo === "configurar" ? item.estado === "livre" || item.estado === "fora" : item.estado === "livre" || item.estado === "selecionado");
      return { chave: `${r}:${c}`, item, focavel };
    }),
  );

  const celulas = matriz.flat();
  // Um único gancho entra na ordem de Tab: o último focado, o selecionado ou o primeiro disponível.
  const parada =
    celulas.find((celula) => celula.chave === ativo && celula.focavel) ??
    celulas.find((celula) => celula.focavel && celula.item.estado === "selecionado") ??
    celulas.find((celula) => celula.focavel);

  function mover(r: number, c: number, dr: number, dc: number) {
    let linha = r + dr;
    let coluna = c + dc;
    while (linha >= 0 && linha < matriz.length && coluna >= 0 && coluna < totalColunas) {
      const alvo = matriz[linha][coluna];
      if (alvo.focavel) {
        setAtivo(alvo.chave);
        refs.current[alvo.chave]?.focus();
        return;
      }
      linha += dr;
      coluna += dc;
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, r: number, c: number) {
    const passos: Record<string, [number, number]> = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
    };
    const passo = passos[event.key];
    if (passo) {
      event.preventDefault();
      mover(r, c, passo[0], passo[1]);
    }
  }

  function handleClick(item: KeyBoardGanchoItem, chave: string) {
    setAtivo(chave);
    if (modo === "configurar") {
      onToggle?.(item.id);
    } else {
      onSelect?.(item.id);
    }
  }

  return (
    <Scroller>
      <Grid role="grid" aria-label={ariaLabel}>
        <Row role="row" $colunas={totalColunas}>
          <ColumnHeader aria-hidden="true" />
          {Array.from({ length: totalColunas }, (_, c) => (
            <ColumnHeader key={c} role="columnheader">
              {c + 1}
            </ColumnHeader>
          ))}
        </Row>
        {linhas.map((linha, r) => (
          <Row key={linha.rotulo} role="row" $colunas={totalColunas}>
            <RowHeader role="rowheader">{linha.rotulo}</RowHeader>
            {matriz[r].map(({ chave, item, focavel }, c) => {
              const legenda = legendaPadrao(item, modo);
              const estado: EstadoGancho = item.bloqueado ? "ocupado" : item.estado;
              return (
                <Cell key={chave} role="gridcell">
                  {focavel ? (
                    <Gancho
                      ref={(node) => {
                        refs.current[chave] = node;
                      }}
                      type="button"
                      $estado={estado}
                      tabIndex={parada?.chave === chave ? 0 : -1}
                      aria-label={nomeAcessivel(item, modo)}
                      aria-pressed={modo === "escolher" ? item.estado === "selecionado" : undefined}
                      onClick={() => handleClick(item, chave)}
                      onKeyDown={(event) => handleKeyDown(event, r, c)}
                    >
                      <span aria-hidden="true">{item.rotulo}</span>
                      {legenda ? <Legenda aria-hidden="true">{legenda}</Legenda> : null}
                    </Gancho>
                  ) : (
                    <GanchoEstatico $estado={estado} role="img" aria-label={nomeAcessivel(item, modo)}>
                      <span aria-hidden="true">{item.rotulo}</span>
                      {legenda ? <Legenda aria-hidden="true">{legenda}</Legenda> : null}
                    </GanchoEstatico>
                  )}
                </Cell>
              );
            })}
          </Row>
        ))}
      </Grid>
    </Scroller>
  );
}
