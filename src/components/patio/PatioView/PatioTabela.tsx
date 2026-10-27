"use client";

import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/Table";
import type { PatioVeiculo } from "@/types/patio";
import { PatioLinha } from "./PatioLinha";
import { Area } from "./PatioView.styles";

export interface PatioTabelaProps {
  veiculos: PatioVeiculo[];
  onRegistrarSaida: (veiculo: PatioVeiculo) => void;
  // A empresa tem quadro de chaves: cada linha ganha o botão de guardar ou trocar a chave.
  comQuadros?: boolean;
  onGuardarChave?: (veiculo: PatioVeiculo) => void;
  // A lista está sendo atualizada: o conteúdo anterior fica esmaecido.
  atualizando?: boolean;
}

// No computador é uma tabela; abaixo de `breakpoints.md` a mesma árvore vira itens de quatro linhas (ver Linha).
export function PatioTabela({ veiculos, onRegistrarSaida, comQuadros = false, onGuardarChave, atualizando = false }: PatioTabelaProps) {
  return (
    <Area $atualizando={atualizando} aria-busy={atualizando}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell head>Placa</TableCell>
            <TableCell head>Veículo</TableCell>
            <TableCell head>Entrada</TableCell>
            <TableCell head>Permanência</TableCell>
            <TableCell head>Tabela e operador</TableCell>
            <TableCell head align="right">
              Ações
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {veiculos.map((veiculo) => (
            <PatioLinha
              key={veiculo.patioId}
              veiculo={veiculo}
              onRegistrarSaida={onRegistrarSaida}
              comQuadros={comQuadros}
              onGuardarChave={onGuardarChave}
            />
          ))}
        </TableBody>
      </Table>
    </Area>
  );
}
