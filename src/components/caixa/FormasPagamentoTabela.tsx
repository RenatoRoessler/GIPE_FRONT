"use client";

import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/Table";
import { FORMA_PAGAMENTO, type TurnoFormaPagamento } from "@/types/caixa";
import { proporcao } from "./agregados";
import { formaPagamentoLabel, formatMoeda } from "./format";
import { Celula, Preenchimento, Trilho } from "./FormasPagamentoTabela.styles";

export interface FormasPagamentoTabelaProps {
  formas: TurnoFormaPagamento[];
}

// Dinheiro primeiro, depois pelo código da forma. Boleto e transferência só existem aqui se a API os devolveu.
export function ordenarFormas(formas: TurnoFormaPagamento[]): TurnoFormaPagamento[] {
  return [...formas].sort((a, b) => {
    if (a.formaPagamento === FORMA_PAGAMENTO.Dinheiro) return -1;
    if (b.formaPagamento === FORMA_PAGAMENTO.Dinheiro) return 1;
    return a.formaPagamento - b.formaPagamento;
  });
}

// O valor de entradas vem sempre em texto; a barra fina só mostra qual forma concentra o movimento.
export function FormasPagamentoTabela({ formas }: FormasPagamentoTabelaProps) {
  const ordenadas = ordenarFormas(formas);
  const maior = Math.max(0, ...ordenadas.map((forma) => (Number.isFinite(forma.entradas) ? forma.entradas : 0)));

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell head>Forma de pagamento</TableCell>
          <TableCell head align="right">
            Entradas
          </TableCell>
          <TableCell head align="right">
            Saídas
          </TableCell>
          <TableCell head align="right">
            Esperado
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {ordenadas.map((forma) => (
          <TableRow key={forma.formaPagamento}>
            <TableCell data-label="Forma de pagamento">{forma.descricao || formaPagamentoLabel(forma.formaPagamento)}</TableCell>
            <TableCell align="right" numeric data-label="Entradas">
              <Celula>
                {formatMoeda(forma.entradas)}
                <Trilho aria-hidden="true">
                  <Preenchimento $percentual={proporcao(forma.entradas, maior)} />
                </Trilho>
              </Celula>
            </TableCell>
            <TableCell align="right" numeric data-label="Saídas">
              {formatMoeda(forma.saidas)}
            </TableCell>
            <TableCell align="right" numeric data-label="Esperado">
              {formatMoeda(forma.valorEsperado)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
