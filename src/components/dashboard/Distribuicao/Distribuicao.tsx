"use client";

import { useTheme } from "styled-components";
import { corDoTema, type Distribuicao as DistribuicaoDados } from "../apresentacao";
import { brlCompacto, percentual } from "../format";
import { PainelDashboard } from "../PainelDashboard";
import { Barra, Linha, Linhas, Marcador, Nome, Numeros, Participacao, Segmento, Valor, Vazio } from "./Distribuicao.styles";

export interface DistribuicaoProps {
  titulo: string;
  distribuicao: DistribuicaoDados;
  // Frase para quando não há nada a mostrar: "Aparece quando houver faturamento no período."
  vazio: string;
}

// Menos de 1% não vira "0%": ainda é dinheiro que entrou.
function participacao(valor: number): string {
  return valor > 0 && valor < 1 ? "<1%" : percentual(valor);
}

// Barra empilhada e lista com valor e participação de cada fatia. A barra só reforça: os números e os nomes estão na lista.
export function Distribuicao({ titulo, distribuicao, vazio }: DistribuicaoProps) {
  const theme = useTheme();
  const { linhas } = distribuicao;

  return (
    <PainelDashboard titulo={titulo}>
      {linhas.length === 0 ? (
        <Vazio>{vazio}</Vazio>
      ) : (
        <>
          <Barra aria-hidden="true">
            {linhas.map((linha) => (
              <Segmento key={linha.chave} $peso={linha.valor} $cor={corDoTema(theme.colors, linha.cor)} />
            ))}
          </Barra>
          <Linhas>
            {linhas.map((linha) => (
              <Linha key={linha.chave}>
                <Nome>
                  <Marcador $cor={corDoTema(theme.colors, linha.cor)} aria-hidden="true" />
                  {linha.nome}
                </Nome>
                <Numeros>
                  <Valor>{brlCompacto(linha.valor)}</Valor>
                  <Participacao>{participacao(linha.percentual)}</Participacao>
                </Numeros>
              </Linha>
            ))}
          </Linhas>
        </>
      )}
    </PainelDashboard>
  );
}
