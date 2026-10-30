"use client";

import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/Table";
import { formatBRL } from "@/lib/money";
import { AGRUPAMENTO_FLUXO, type AgrupamentoFluxo, type FluxoPeriodo } from "@/types/financeiro";
import { formatDataBr, formatSaldo, rotuloMesExtenso } from "../format";
import { Detalhes, Negativo, Quieto } from "../ReguaSaldo/ReguaSaldo.styles";

export interface TabelaPeriodosProps {
  periodos: FluxoPeriodo[];
  agrupamento: AgrupamentoFluxo;
}

function Saldo({ valor }: { valor: number }) {
  return valor < 0 ? <Negativo>{formatSaldo(valor)}</Negativo> : <>{formatSaldo(valor)}</>;
}

// Os mesmos valores da régua, completos e exatos: todos os dias (ou meses) do período, inclusive os sem movimento.
export function TabelaPeriodos({ periodos, agrupamento }: TabelaPeriodosProps) {
  const porMes = agrupamento === AGRUPAMENTO_FLUXO.Mes;

  return (
    <Detalhes>
      <summary>{porMes ? "Ver valores por mês" : "Ver valores por dia"}</summary>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell head>{porMes ? "Mês" : "Data"}</TableCell>
            <TableCell head align="right">
              Entradas
            </TableCell>
            <TableCell head align="right">
              Saídas
            </TableCell>
            <TableCell head align="right">
              Saldo
            </TableCell>
            <TableCell head align="right">
              Acumulado
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {periodos.map((periodo) => {
            const semMovimento = periodo.entradas === 0 && periodo.saidas === 0;
            const celula = (conteudo: React.ReactNode) => (semMovimento ? <Quieto>{conteudo}</Quieto> : conteudo);
            return (
              <TableRow key={periodo.data}>
                <TableCell data-label={porMes ? "Mês" : "Data"} numeric>
                  {celula(porMes ? rotuloMesExtenso(periodo.data) : formatDataBr(periodo.data))}
                </TableCell>
                <TableCell data-label="Entradas" align="right" numeric>
                  {celula(formatBRL(periodo.entradas))}
                </TableCell>
                <TableCell data-label="Saídas" align="right" numeric>
                  {celula(formatBRL(periodo.saidas))}
                </TableCell>
                <TableCell data-label="Saldo" align="right" numeric>
                  {semMovimento ? <Quieto>{formatSaldo(periodo.saldo)}</Quieto> : <Saldo valor={periodo.saldo} />}
                </TableCell>
                <TableCell data-label="Acumulado" align="right" numeric>
                  <Saldo valor={periodo.saldoAcumulado} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Detalhes>
  );
}
