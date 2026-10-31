"use client";

import { useId, useState } from "react";
import { useTecladoCampo } from "@/components/teclado/useTecladoCampo";
import { Select } from "@/components/ui/Select";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { TECLADO_INTEIRO } from "@/lib/teclado/tipos";
import { TIPO_CATEGORIA, TIPO_CATEGORIA_OPTIONS, type PrecoView, type TipoCategoria } from "@/types/preco";
import { formatBRL, formatMinutos } from "../format";
import { estimarCobranca, type Estimativa } from "./estimarCobranca";
import {
  Anuncio,
  Aviso,
  Bloco,
  Controles,
  Equivalencia,
  Explicacao,
  Minutos,
  Permanencia,
  PermanenciaLabel,
  PermanenciaLinha,
  Resultado,
  SemValor,
  Titulo,
  Valor,
  ValorBruto,
} from "./SimuladorCobranca.styles";

export const AVISO_ESTIMATIVA = "Estimativa. O valor real é calculado no momento da saída.";
export const ANUNCIO_DEBOUNCE_MS = 400;
export const PERMANENCIA_MAXIMA = 900;
const PERMANENCIA_INICIAL = 150;
const PASSO = 5;

// "Todas" não é uma categoria de veículo: o usuário escolhe uma categoria real para simular.
const CATEGORIAS = TIPO_CATEGORIA_OPTIONS.filter((option) => option.value !== TIPO_CATEGORIA.Todas);

export interface SimuladorCobrancaProps {
  preco: PrecoView;
}

function categoriaInicial(preco: PrecoView): TipoCategoria {
  return preco.categorias.find((categoria) => categoria !== TIPO_CATEGORIA.Todas) ?? TIPO_CATEGORIA.CarroMedio;
}

function limitar(valor: number): number {
  if (!Number.isFinite(valor)) {
    return 0;
  }
  return Math.min(Math.max(Math.round(valor), 0), PERMANENCIA_MAXIMA);
}

function nomeDaCategoria(categoria: TipoCategoria): string {
  return CATEGORIAS.find((option) => option.value === categoria)?.label ?? "";
}

function frase(estimativa: Estimativa, categoria: TipoCategoria): string {
  switch (estimativa.tipo) {
    case "nao_aplica":
      return `Esta tabela não se aplica a ${nomeDaCategoria(categoria)}.`;
    case "sem_regra":
      return "Esta tabela ainda não tem valores para essa permanência.";
    default:
      return `Estimativa de ${formatBRL(estimativa.valor)}. ${estimativa.explicacao}.`;
  }
}

// Estimativa na tela: nunca substitui o valor calculado pelo sistema na saída. O componente deve ser
// remontado (key) ao trocar de tabela, para a categoria inicial e a permanência voltarem ao padrão.
export function SimuladorCobranca({ preco }: SimuladorCobrancaProps) {
  const ids = useId();
  const [categoria, setCategoria] = useState<TipoCategoria>(() => categoriaInicial(preco));
  const [minutos, setMinutos] = useState(PERMANENCIA_INICIAL);
  const tecladoMinutos = useTecladoCampo(TECLADO_INTEIRO, { inputMode: "numeric" });

  const estimativa = estimarCobranca(preco, categoria, minutos);
  // O resultado visível muda a cada passo; o anúncio para leitor de tela só depois que o usuário para de mexer.
  const minutosAnunciados = useDebouncedValue(minutos, ANUNCIO_DEBOUNCE_MS);
  const anuncio = frase(estimarCobranca(preco, categoria, minutosAnunciados), categoria);

  return (
    <Bloco aria-labelledby={`${ids}-titulo`}>
      <Titulo id={`${ids}-titulo`}>Simular cobrança</Titulo>

      <Controles>
        <Select label="Categoria" value={String(categoria)} onChange={(event) => setCategoria(Number(event.target.value) as TipoCategoria)}>
          {CATEGORIAS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        <Permanencia>
          <PermanenciaLabel htmlFor={`${ids}-minutos`}>Permanência (minutos)</PermanenciaLabel>
          <PermanenciaLinha>
            <input
              type="range"
              aria-label="Permanência em minutos, controle deslizante"
              min={0}
              max={PERMANENCIA_MAXIMA}
              step={PASSO}
              value={minutos}
              onChange={(event) => setMinutos(limitar(Number(event.target.value)))}
            />
            <Minutos
              id={`${ids}-minutos`}
              type="text"
              inputMode="numeric"
              maxLength={String(PERMANENCIA_MAXIMA).length}
              value={minutos}
              onChange={(event) => setMinutos(limitar(Number(event.target.value)))}
              {...tecladoMinutos}
            />
          </PermanenciaLinha>
          <Equivalencia>= {formatMinutos(minutos)}</Equivalencia>
        </Permanencia>
      </Controles>

      <Resultado data-testid="resultado-estimativa">
        {estimativa.tipo === "valor" ? (
          <>
            <Valor>{formatBRL(estimativa.valor)}</Valor>
            {estimativa.descontoPercentual !== null && <ValorBruto aria-label={`Valor sem desconto ${formatBRL(estimativa.bruto)}`}>{formatBRL(estimativa.bruto)}</ValorBruto>}
            <Explicacao>{estimativa.explicacao}</Explicacao>
          </>
        ) : (
          <SemValor>{frase(estimativa, categoria)}</SemValor>
        )}
      </Resultado>

      <Aviso>{AVISO_ESTIMATIVA}</Aviso>
      <Anuncio role="status" aria-live="polite">
        {anuncio}
      </Anuncio>
    </Bloco>
  );
}
