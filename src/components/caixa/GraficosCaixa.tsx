"use client";

import { useId } from "react";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/Table";
import { Text } from "@/components/ui/Text";
import type { Movimento } from "@/types/caixa";
import { picoDeEntradas, proporcao, totaisPorForma, totaisPorHora } from "./agregados";
import { formaPagamentoLabel, formatMoeda } from "./format";
import {
  Amostra,
  Coluna,
  Colunas,
  Detalhes,
  Eixo,
  FormaItem,
  FormaNome,
  Formas,
  Haste,
  Legenda,
  LinhaBarra,
  Painel,
  PainelTitulo,
  Preenchimento,
  Raiz,
  Trilho,
} from "./GraficosCaixa.styles";

export interface GraficosCaixaProps {
  movimentos: Movimento[];
}

function LegendaSeries() {
  return (
    <Legenda>
      <span>
        <Amostra $tom="success" aria-hidden="true" />
        Entradas
      </span>
      <span>
        <Amostra $tom="danger" aria-hidden="true" />
        Saídas e retiradas
      </span>
    </Legenda>
  );
}

function PorForma({ movimentos }: GraficosCaixaProps) {
  const tituloId = useId();
  const totais = totaisPorForma(movimentos);
  const maior = Math.max(0, ...totais.flatMap((total) => [total.entradas, total.saidas]));
  const percentual = (valor: number) => (proporcao(valor, maior) === 0 ? 0 : Math.max(3, proporcao(valor, maior)));

  return (
    <Painel aria-labelledby={tituloId}>
      <PainelTitulo id={tituloId}>Por forma de pagamento</PainelTitulo>
      {totais.length === 0 ? (
        <Text variant="muted">Sem movimentos para o gráfico.</Text>
      ) : (
        <>
          <LegendaSeries />
          <Formas>
            {totais.map((total) => (
              <FormaItem key={total.formaPagamento}>
                <FormaNome>{formaPagamentoLabel(total.formaPagamento)}</FormaNome>
                <LinhaBarra>
                  <Trilho aria-hidden="true">
                    <Preenchimento $tom="success" $percentual={percentual(total.entradas)} />
                  </Trilho>
                  <span>Entradas {formatMoeda(total.entradas)}</span>
                </LinhaBarra>
                <LinhaBarra>
                  <Trilho aria-hidden="true">
                    <Preenchimento $tom="danger" $percentual={percentual(total.saidas)} />
                  </Trilho>
                  <span>Saídas {formatMoeda(total.saidas)}</span>
                </LinhaBarra>
              </FormaItem>
            ))}
          </Formas>
        </>
      )}
    </Painel>
  );
}

function PorHora({ movimentos }: GraficosCaixaProps) {
  const tituloId = useId();
  const horas = totaisPorHora(movimentos);
  const pico = picoDeEntradas(horas);
  const comMovimento = horas.filter((item) => item.entradas > 0 || item.saidas > 0);
  const maior = Math.max(0, ...horas.flatMap((item) => [item.entradas, item.saidas]));
  const percentual = (valor: number) => proporcao(valor, maior);
  const resumo =
    pico === null
      ? "Sem entradas no período."
      : `Pico de entradas às ${pico.hora}h: ${formatMoeda(pico.valor)}.`;

  return (
    <Painel aria-labelledby={tituloId}>
      <PainelTitulo id={tituloId}>Por hora</PainelTitulo>
      {comMovimento.length === 0 ? (
        <Text variant="muted">Sem movimentos para o gráfico.</Text>
      ) : (
        <>
          <Text variant="muted">{resumo}</Text>
          <LegendaSeries />
          <Colunas role="img" aria-label={`Entradas e saídas por hora. ${resumo}`}>
            {horas.map((item) => (
              <Coluna key={item.hora}>
                <Haste $tom="success" $percentual={percentual(item.entradas)} />
                <Haste $tom="danger" $percentual={percentual(item.saidas)} />
              </Coluna>
            ))}
          </Colunas>
          <Eixo aria-hidden="true">
            {horas.map((item) => (
              <span key={item.hora}>{item.hora % 6 === 0 ? `${item.hora}h` : ""}</span>
            ))}
          </Eixo>
          <Detalhes>
            <summary>Ver valores por hora</summary>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell head>Hora</TableCell>
                  <TableCell head align="right">
                    Entradas
                  </TableCell>
                  <TableCell head align="right">
                    Saídas
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {comMovimento.map((item) => (
                  <TableRow key={item.hora}>
                    <TableCell data-label="Hora">{`${item.hora}h`}</TableCell>
                    <TableCell align="right" numeric data-label="Entradas">
                      {formatMoeda(item.entradas)}
                    </TableCell>
                    <TableCell align="right" numeric data-label="Saídas">
                      {formatMoeda(item.saidas)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Detalhes>
        </>
      )}
    </Painel>
  );
}

// Os mesmos movimentos da lista, agregados. O valor sempre aparece em texto; barras e colunas só reforçam.
export function GraficosCaixa({ movimentos }: GraficosCaixaProps) {
  return (
    <Raiz>
      <PorForma movimentos={movimentos} />
      <PorHora movimentos={movimentos} />
    </Raiz>
  );
}
